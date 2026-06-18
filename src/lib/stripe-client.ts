// TODO (Phase 5 — Stripe wiring):
// 1. Run `npm install @stripe/stripe-js`.
// 2. Add your Stripe publishable key to .env.local (see .env.example).
// 3. Deploy the serverless functions in /netlify/functions, which create
//    the actual Checkout Sessions using your secret key server-side.
// 4. Wire the buttons in src/pages/client/Invoices.tsx and
//    src/pages/client/Membership.tsx to call these helpers.

export async function startInvoiceCheckout(invoiceId: string, amountCents: number) {
  const res = await fetch("/.netlify/functions/create-checkout-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ invoiceId, amountCents }),
  });
  if (!res.ok) throw new Error("Failed to start checkout session");
  const { url } = await res.json();
  window.location.href = url;
}

export async function startMembershipSubscription(tier: string) {
  const res = await fetch("/.netlify/functions/create-subscription-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tier }),
  });
  if (!res.ok) throw new Error("Failed to start subscription session");
  const { url } = await res.json();
  window.location.href = url;
}
