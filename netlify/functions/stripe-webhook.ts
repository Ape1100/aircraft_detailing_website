// Netlify Function: stripe-webhook
// ---------------------------------------------------------------------
// Verifies Stripe webhook signatures and persists the result of each
// event to Supabase. Identifying info relied on per event, and where
// it's actually set:
//
//   checkout.session.completed — reads session.metadata directly (set
//   at session-creation time in create-checkout-session.ts /
//   create-subscription-session.ts, so this is always present for
//   sessions created by this app):
//     - metadata.invoiceId    -> mark that invoices row paid, insert a
//                                payments row for the charged amount.
//     - metadata.customQuoteId -> set custom_quotes.paid_at (there is no
//                                "paid" value in custom_quote_status —
//                                see schema.sql comment on that column).
//     - mode === "subscription" + metadata.tier + metadata.clientId ->
//       insert a new memberships row with stripe_subscription_id =
//       session.subscription. clientId is REQUIRED input to
//       create-subscription-session.ts specifically so this metadata
//       exists — without it, there'd be no way to know whose membership
//       a later customer.subscription.deleted event refers to.
//
//   invoice.paid — deliberately does NOT rely on the Stripe Invoice
//   object's own .metadata (Stripe does not reliably copy a
//   subscription's metadata onto invoices generated for it across API
//   versions — depending on that would be fragile). Instead uses
//   invoice.parent.subscription_details.subscription, the field always
//   present on subscription billing invoices in this API version, to
//   find the membership by
//   memberships.stripe_subscription_id (set above) and confirm it
//   active.
//
//   customer.subscription.deleted — uses the Subscription object's own
//   .id, which needs no metadata at all, matched the same way against
//   memberships.stripe_subscription_id.
//
// On any persistence failure this returns 500 (not 200) so Stripe
// retries delivery — silently swallowing a DB error here would mean a
// real payment that never gets reflected in Supabase.
// ---------------------------------------------------------------------

import type { Handler } from "@netlify/functions";
import Stripe from "stripe";
import { Resend } from "resend";
import { createSupabaseAdminClient } from "./pricing-settings";

/** Looks up the client's email from profiles, then sends a payment
 * receipt via Resend. Any error — missing key, missing email, Resend
 * API failure — is logged but NOT thrown: the payment is already
 * recorded in Supabase and the webhook must still return 200. A failed
 * receipt email is lower-stakes than a failed payment record. */
async function sendPaymentReceipt(
  clientId: string,
  amountDollars: number,
  description: string
): Promise<void> {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    console.warn("[receipt] RESEND_API_KEY or RESEND_FROM_EMAIL not set — skipping receipt email.");
    return;
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, name")
      .eq("id", clientId)
      .maybeSingle();

    if (!profile?.email) {
      console.warn(`[receipt] No email found for client ${clientId} — skipping receipt.`);
      return;
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const greeting = profile.name ? `Hi ${profile.name},` : "Hi,";
    const fromName = process.env.RESEND_FROM_EMAIL.split("@")[1]?.split(".")[0] ?? "Brightwork";

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: profile.email,
      subject: `Payment received — $${amountDollars.toFixed(2)}`,
      html: `
        <p>${greeting}</p>
        <p>We've received your payment of <strong>$${amountDollars.toFixed(2)}</strong> for ${description} on ${dateStr}.</p>
        <p>Thank you for your business.</p>
        <p style="color:#888;font-size:12px;">— ${fromName.charAt(0).toUpperCase() + fromName.slice(1)}</p>
      `,
    });

    if (error) {
      console.error("[receipt] Resend returned an error:", error.message);
    } else {
      console.log(`[receipt] Sent payment receipt to ${profile.email} for ${description}.`);
    }
  } catch (err) {
    console.error("[receipt] Unexpected error sending receipt:", (err as Error).message);
  }
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2026-06-24.dahlia",
});

/** Postgres unique-violation code. The select-then-insert checks below race
 * against a near-simultaneous duplicate delivery (see
 * payments_invoice_charge_unique / memberships_subscription_unique in
 * schema.sql, which are the actual backstop) — when that race is lost, this
 * tells the insert's failure apart from a real error so it can be treated
 * as "already processed" instead of a 500. */
function isUniqueViolation(error: { code?: string } | null): boolean {
  return error?.code === "23505";
}

function asId(value: string | Stripe.Subscription | Stripe.PaymentIntent | null | undefined): string | undefined {
  if (!value) return undefined;
  return typeof value === "string" ? value : value.id;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const sig = event.headers["stripe-signature"] as string | undefined;
  if (!sig) {
    return { statusCode: 400, body: "Missing stripe-signature header" };
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return { statusCode: 500, body: "Missing STRIPE_WEBHOOK_SECRET environment variable" };
  }

  let stripeEvent: Stripe.Event;
  try {
    stripeEvent = stripe.webhooks.constructEvent(event.body || "", sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return { statusCode: 400, body: `Webhook signature verification failed: ${(err as Error).message}` };
  }

  try {
    const supabase = createSupabaseAdminClient();

    switch (stripeEvent.type) {
      case "checkout.session.completed": {
        const session = stripeEvent.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata ?? {};
        const chargedAmount = (session.amount_total ?? 0) / 100;

        // Stripe explicitly documents that webhook events may be delivered
        // more than once for the same event, so every branch below must be
        // idempotent: check whether this event's effect was already applied
        // before writing, rather than assuming a single delivery.
        if (metadata.invoiceId) {
          const chargeId = asId(session.payment_intent);
          const { data: existingPayment } = await supabase
            .from("payments")
            .select("id")
            .eq("invoice_id", metadata.invoiceId)
            .eq("stripe_charge_id", chargeId ?? "")
            .maybeSingle();

          if (!existingPayment) {
            const { error: invoiceError } = await supabase
              .from("invoices")
              .update({ status: "paid" })
              .eq("id", metadata.invoiceId);
            if (invoiceError) throw invoiceError;

            const { error: paymentError } = await supabase.from("payments").insert({
              invoice_id: metadata.invoiceId,
              amount: chargedAmount,
              method: "card",
              stripe_charge_id: chargeId,
            });
            if (paymentError && !isUniqueViolation(paymentError)) throw paymentError;

            // Receipt email — runs after Supabase writes succeed; errors
            // are caught inside and must NOT propagate to the caller.
            if (metadata.clientId) {
              const invoiceRef = `Invoice #${String(metadata.invoiceId).slice(0, 8).toUpperCase()}`;
              await sendPaymentReceipt(metadata.clientId, chargedAmount, invoiceRef);
            }
          }
        } else if (metadata.customQuoteId) {
          const { data: quote } = await supabase
            .from("custom_quotes")
            .select("paid_at")
            .eq("id", metadata.customQuoteId)
            .maybeSingle();

          if (!quote?.paid_at) {
            const { error } = await supabase
              .from("custom_quotes")
              .update({ paid_at: new Date().toISOString(), stripe_checkout_session_id: session.id })
              .eq("id", metadata.customQuoteId);
            if (error) throw error;

            // Receipt email — runs after Supabase write succeeds.
            if (metadata.clientId) {
              await sendPaymentReceipt(metadata.clientId, chargedAmount, "Custom Quote");
            }
          }
        } else if (session.mode === "subscription" && metadata.tier && metadata.clientId) {
          const subscriptionId = asId(session.subscription);
          const { data: existingMembership } = await supabase
            .from("memberships")
            .select("id")
            .eq("stripe_subscription_id", subscriptionId ?? "")
            .maybeSingle();

          if (!existingMembership) {
            const { error } = await supabase.from("memberships").insert({
              client_id: metadata.clientId,
              tier: metadata.tier,
              monthly_amount: chargedAmount,
              status: "active",
              stripe_subscription_id: subscriptionId,
            });
            if (error && !isUniqueViolation(error)) throw error;
          }
        }
        break;
      }

      case "invoice.paid": {
        const invoice = stripeEvent.data.object as Stripe.Invoice;
        // In this API version, the subscription that generated an
        // invoice lives at parent.subscription_details.subscription,
        // not a top-level `invoice.subscription` field.
        const subscriptionId = asId(invoice.parent?.subscription_details?.subscription ?? undefined);
        if (subscriptionId) {
          const { error } = await supabase
            .from("memberships")
            .update({ status: "active" })
            .eq("stripe_subscription_id", subscriptionId);
          if (error) throw error;
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = stripeEvent.data.object as Stripe.Subscription;
        const { error } = await supabase
          .from("memberships")
          .update({ status: "cancelled" })
          .eq("stripe_subscription_id", subscription.id);
        if (error) throw error;
        break;
      }

      default:
        break;
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: (err as Error).message }) };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ received: true }),
  };
};
