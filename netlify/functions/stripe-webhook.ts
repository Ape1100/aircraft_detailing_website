// Netlify Function: stripe-webhook
// ---------------------------------------------------------------------
// TODO before this works:
// 1. `npm install stripe`.
// 2. In the Stripe dashboard, add a webhook endpoint pointing to
//    https://<your-site>/.netlify/functions/stripe-webhook
//    and select events: checkout.session.completed,
//    invoice.paid, customer.subscription.deleted (add more as needed).
// 3. Copy the webhook signing secret into STRIPE_WEBHOOK_SECRET.
// 4. Wire the TODOs below to your Supabase tables (invoices, payments,
//    memberships) once Supabase is connected.
// ---------------------------------------------------------------------

import type { Handler } from "@netlify/functions";
// import Stripe from "stripe";

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
//   apiVersion: "2024-06-20",
// });

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  // TODO: verify the webhook signature before trusting the payload:
  //
  // const sig = event.headers["stripe-signature"] as string;
  // let stripeEvent;
  // try {
  //   stripeEvent = stripe.webhooks.constructEvent(
  //     event.body as string,
  //     sig,
  //     process.env.STRIPE_WEBHOOK_SECRET as string
  //   );
  // } catch (err) {
  //   return { statusCode: 400, body: `Webhook signature verification failed` };
  // }
  //
  // switch (stripeEvent.type) {
  //   case "checkout.session.completed":
  //     // TODO: mark the related invoice as paid in Supabase, insert a
  //     // payments row, and (for subscriptions) create/update the
  //     // memberships row with the Stripe subscription id.
  //     break;
  //   case "customer.subscription.deleted":
  //     // TODO: mark the related membership as cancelled.
  //     break;
  // }

  return {
    statusCode: 501,
    body: JSON.stringify({
      error: "Stripe webhook handling is not configured yet. See the TODO comments in this file.",
    }),
  };
};
