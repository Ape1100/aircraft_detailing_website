// Netlify Function: create-subscription-session
// ---------------------------------------------------------------------
// TODO before this works:
// 1. `npm install stripe`.
// 2. Create a Stripe Product + recurring Price for each membership tier
//    (Ramp Ready, Owner Care, Preservation) and note the price IDs below.
// 3. Set STRIPE_SECRET_KEY and SITE_URL in your Netlify environment.
// ---------------------------------------------------------------------

import type { Handler } from "@netlify/functions";
// import Stripe from "stripe";

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
//   apiVersion: "2024-06-20",
// });

// TODO: replace with your real Stripe Price IDs once created in the dashboard.
const PRICE_ID_BY_TIER: Record<string, string> = {
  ramp_ready: "price_REPLACE_ME",
  owner_care: "price_REPLACE_ME",
  preservation: "price_REPLACE_ME",
};

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    const { tier } = JSON.parse(event.body || "{}");
    const priceId = PRICE_ID_BY_TIER[tier];

    if (!priceId) {
      return { statusCode: 400, body: "Unknown or unconfigured membership tier" };
    }

    // TODO: replace this mock response with a real Stripe subscription Checkout Session:
    //
    // const session = await stripe.checkout.sessions.create({
    //   mode: "subscription",
    //   line_items: [{ price: priceId, quantity: 1 }],
    //   success_url: `${process.env.SITE_URL}/portal/membership?updated=1`,
    //   cancel_url: `${process.env.SITE_URL}/portal/membership`,
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
