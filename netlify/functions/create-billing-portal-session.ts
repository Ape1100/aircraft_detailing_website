// Netlify Function: create-billing-portal-session
// ---------------------------------------------------------------------
// Opens Stripe's hosted Billing Portal for a client who already has a
// membership, so they can update their payment method, view invoices, or
// cancel — WITHOUT creating a second parallel subscription. This is
// deliberately separate from create-subscription-session.ts, which is
// for starting a brand new membership and must never be reused for an
// existing one (doing so previously created a duplicate active
// subscription, double-billing the client — see Membership.tsx history).
//
// The memberships table has no stored Stripe customer id, only
// stripe_subscription_id, so the customer is resolved by retrieving that
// subscription from Stripe rather than requiring a schema change.
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

  const clientId = body.clientId;
  if (typeof clientId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clientId)) {
    return badRequest("clientId must be a UUID");
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data: membership, error } = await supabase
      .from("memberships")
      .select("stripe_subscription_id")
      .eq("client_id", clientId)
      .eq("status", "active")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }

    if (!membership?.stripe_subscription_id) {
      return { statusCode: 404, body: JSON.stringify({ error: "No active membership found for this client" }) };
    }

    const subscription = await stripe.subscriptions.retrieve(membership.stripe_subscription_id);
    const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.SITE_URL}/portal/membership`,
    });

    return { statusCode: 200, body: JSON.stringify({ url: portalSession.url }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: (err as Error).message }) };
  }
};
