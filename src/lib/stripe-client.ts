// There is deliberately no startEstimateCheckout() here. Instant estimates
// can never be paid directly — see the policy comment at the top of
// netlify/functions/create-checkout-session.ts. The only one-time-payment
// paths are an issued invoice or a verified custom quote, below.

import { supabase } from "@/lib/supabase-client";

export async function startInvoiceCheckout(invoiceId: string) {
  const res = await fetch("/.netlify/functions/create-checkout-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ invoiceId }),
  });
  if (!res.ok) throw new Error("Failed to start checkout session");
  const { url } = await res.json();
  window.location.href = url;
}

/** Pays a custom quote that an admin has marked "verified" (physically
 * confirmed in person and locked in) — see PayabilityBadge. The server
 * looks the quote up by id and re-checks its status itself; nothing here
 * is trusted beyond the id. */
export async function startCustomQuoteCheckout(customQuoteId: string) {
  const res = await fetch("/.netlify/functions/create-checkout-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ customQuoteId }),
  });
  if (!res.ok) {
    const { error } = await res.json().catch(() => ({ error: "Failed to start checkout session" }));
    throw new Error(error);
  }
  const { url } = await res.json();
  window.location.href = url;
}

/** Resolves the signed-in user's id itself (rather than requiring every
 * caller to thread it through) so the checkout session's metadata
 * carries enough to link a Stripe subscription back to a memberships
 * row later — see stripe-webhook.ts, which has no other reliable way to
 * identify whose membership a customer.subscription.deleted event
 * belongs to. Throws if there's no signed-in session. */
export async function startMembershipSubscription(tier: string) {
  const { data } = await supabase.auth.getSession();
  const clientId = data.session?.user?.id;
  if (!clientId) throw new Error("You must be signed in to manage a membership.");

  const res = await fetch("/.netlify/functions/create-subscription-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tier, clientId }),
  });
  if (!res.ok) throw new Error("Failed to start subscription session");
  const { url } = await res.json();
  window.location.href = url;
}
