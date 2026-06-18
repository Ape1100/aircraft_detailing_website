// Netlify Function: create-checkout-session
// ---------------------------------------------------------------------
// TODO before this works:
// 1. `npm install stripe` (server-side SDK, separate from @stripe/stripe-js).
// 2. Set STRIPE_SECRET_KEY and SITE_URL in your Netlify environment
//    variables (Site settings > Environment variables) — never commit
//    the secret key to git.
// 3. Deploy to Netlify, or run `netlify dev` locally to test functions.
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

  try {
    const { invoiceId, amountCents } = JSON.parse(event.body || "{}");

    if (!invoiceId || !amountCents) {
      return { statusCode: 400, body: "Missing invoiceId or amountCents" };
    }

    // TODO: replace this mock response with a real Stripe Checkout Session:
    //
    // const session = await stripe.checkout.sessions.create({
    //   mode: "payment",
    //   line_items: [
    //     {
    //       price_data: {
    //         currency: "usd",
    //         product_data: { name: `Brightwork invoice ${invoiceId}` },
    //         unit_amount: amountCents,
    //       },
    //       quantity: 1,
    //     },
    //   ],
    //   success_url: `${process.env.SITE_URL}/portal/invoices?paid=1`,
    //   cancel_url: `${process.env.SITE_URL}/portal/invoices`,
    //   metadata: { invoiceId },
    // });
    // return { statusCode: 200, body: JSON.stringify({ url: session.url }) };

    return {
      statusCode: 501,
      body: JSON.stringify({
        error: "Stripe is not configured yet. See the TODO comments in this file.",
      }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: (err as Error).message }) };
  }
};
