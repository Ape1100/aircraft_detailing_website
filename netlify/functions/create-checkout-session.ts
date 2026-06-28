// Netlify Function: create-checkout-session
// ---------------------------------------------------------------------
// Creates a Stripe Checkout Session for a one-time payment. The request
// body is discriminated by which top-level field is present:
//
//   1. { invoiceId } — pay down an already-issued invoice. `amount` is
//      read straight from the `invoices` table (set by trusted/admin
//      code elsewhere, e.g. converting an accepted quote). There is
//      nothing price-related for the client to falsify here since the
//      client sends only an id.
//
//   2. { customQuoteId } — pay a finalized custom quote built by an
//      admin (see CustomQuote in src/lib/settings-store.tsx).
//
// ===========================================================================
// DELIBERATE BUSINESS POLICY — DO NOT "FIX" THIS BY RE-ENABLING ESTIMATE PAY
// ===========================================================================
// There used to be a third mode here: { estimate, discountRuleId?, clientId? }
// — pay directly from the public EstimateWizard's self-reported numbers,
// recomputed server-side via calculateEstimate(). That mode has been REMOVED
// ENTIRELY, not just unwired from a frontend button.
//
// Per explicit business policy: no payment may ever be collected based on a
// customer's self-reported estimate alone. Every job must be manually
// verified in person before it is payable. An instant estimate is, by
// definition, unverified — it's priced from whatever category/condition/
// services the customer clicked through on the wizard, with no admin having
// laid eyes on the aircraft. The fact that calculateEstimate() can produce a
// server-trusted dollar figure does NOT make that figure payable; "trusted
// arithmetic on untrusted facts" is still untrusted.
//
// If you're reading this because you want to let customers pay straight from
// the estimate wizard again: don't. The correct flow is for the admin to
// review the request and build a CustomQuote (see AdminCustomQuote.tsx),
// which becomes payable only once finalized (see the status check in
// handleCustomQuoteCheckout below). If the business genuinely changes this
// policy, that's a product decision for a human to make explicitly — not
// something to restore because the code "looked unfinished."
// ===========================================================================
//
// Make sure STRIPE_SECRET_KEY and SITE_URL are set in your Netlify
// environment.
// ---------------------------------------------------------------------

import type { Handler } from "@netlify/functions";
import Stripe from "stripe";
import { createSupabaseAdminClient } from "./pricing-settings";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2026-06-24.dahlia",
});

function badRequest(message: string) {
  return { statusCode: 400, body: JSON.stringify({ error: message }) };
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  if (!process.env.SITE_URL) {
    return { statusCode: 500, body: "Missing SITE_URL environment variable" };
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return badRequest("Malformed JSON body");
  }

  if (typeof body.estimate !== "undefined") {
    return {
      statusCode: 403,
      body: JSON.stringify({
        error:
          "Instant estimates can't be paid directly. Every job must be manually verified in person before it's payable — request a finalized quote from us first.",
      }),
    };
  }

  if (typeof body.invoiceId === "string") {
    return handleInvoiceCheckout(body.invoiceId);
  }

  if (typeof body.customQuoteId === "string") {
    return handleCustomQuoteCheckout(body.customQuoteId);
  }

  return badRequest("Request must include either invoiceId or customQuoteId");
};

async function handleInvoiceCheckout(invoiceId: string) {
  try {
    const supabase = createSupabaseAdminClient();
    const { data: invoice, error } = await supabase
      .from("invoices")
      .select("id, client_id, amount, deposit_amount, status")
      .eq("id", invoiceId)
      .maybeSingle();

    if (error) {
      return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }

    if (!invoice) {
      return { statusCode: 404, body: "Invoice not found" };
    }

    if (invoice.status === "paid") {
      return { statusCode: 400, body: "Invoice has already been paid" };
    }

    const amount = Number(invoice.amount);
    const deposit = invoice.deposit_amount != null ? Number(invoice.deposit_amount) : 0;
    const remainingAmount = Math.max(0, amount - deposit);
    if (remainingAmount <= 0) {
      return { statusCode: 400, body: "Invoice does not have a payable balance" };
    }

    const amountCents = Math.round(remainingAmount * 100);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: `Brightwork invoice ${invoiceId}` },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.SITE_URL}/portal/invoices?paid=1`,
      cancel_url: `${process.env.SITE_URL}/portal/invoices`,
      metadata: {
        invoiceId,
        clientId: invoice.client_id,
      },
    });

    if (!session.url) {
      return { statusCode: 500, body: "Failed to create Stripe checkout session" };
    }

    return { statusCode: 200, body: JSON.stringify({ url: session.url }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: (err as Error).message }) };
  }
}

// Only a quote with status "verified" — meaning an admin has physically
// confirmed the aircraft/job and locked in the number (see
// AdminCustomQuote.tsx's "Mark verified & lock for payment" action, which
// writes that transition to Supabase) — may be charged. draft/sent/accepted
// all read as "price may still change" and are rejected the same as a raw
// estimate would be.
async function handleCustomQuoteCheckout(customQuoteId: string) {
  try {
    const supabase = createSupabaseAdminClient();
    const { data: quote, error } = await supabase
      .from("custom_quotes")
      .select("id, client_id, client_name, total, status")
      .eq("id", customQuoteId)
      .maybeSingle();

    if (error) {
      return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }

    if (!quote) {
      return { statusCode: 404, body: "Custom quote not found" };
    }

    if (quote.status !== "verified") {
      return {
        statusCode: 403,
        body: JSON.stringify({
          error: `This quote is not finalized yet (status: ${quote.status}) — it must be verified in person before it's payable.`,
        }),
      };
    }

    const total = Number(quote.total);
    if (!(total > 0)) {
      return { statusCode: 400, body: "Quote does not have a payable total" };
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: `Brightwork custom quote — ${quote.client_name}` },
            unit_amount: Math.round(total * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.SITE_URL}/portal/invoices?paid=1`,
      cancel_url: `${process.env.SITE_URL}/portal/invoices`,
      metadata: {
        customQuoteId,
        clientId: quote.client_id,
      },
    });

    if (!session.url) {
      return { statusCode: 500, body: "Failed to create Stripe checkout session" };
    }

    return { statusCode: 200, body: JSON.stringify({ url: session.url, amount: total }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: (err as Error).message }) };
  }
}
