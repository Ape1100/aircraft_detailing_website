// Netlify Function: create-subscription-session
// ---------------------------------------------------------------------
// Creates a Stripe Checkout Session for a recurring membership. The
// client sends a membership tier and the signed-in user's id — never a
// price — and this function independently derives the authoritative
// monthly amount. clientId is required so the Checkout Session's
// metadata carries enough for stripe-webhook.ts to later attach the
// resulting subscription to a memberships row (see that file for how
// customer.subscription.deleted / invoice.paid are handled):
//
//   1. Load current pricing settings (server-loaded service catalog +
//      pricing config — see pricing-settings.ts; falls back to the
//      DEFAULT_* constants in pricing-engine.ts if Supabase isn't
//      configured or the pricing tables don't exist yet).
//   2. Run a representative baseline aircraft + service bundle for the
//      requested tier through calculateEstimate(), with
//      ctx.membershipTier set so the engine applies
//      config.membershipDiscount itself.
//   3. Charge estimate.total — the exact deterministic figure, not the
//      confidence-variance low/high range that's meant for the
//      instant-estimate UI.
//
// Tier contents (confirmed business decision — "minimal escalation",
// each tier a strict superset of the one below plus added scope/
// frequency, so price ordering holds structurally rather than by luck):
//   Ramp Ready   — exterior wash, monthly.
//   Owner Care   — + bug/exhaust residue removal, monthly;
//                  + interior refresh, quarterly.
//   Preservation — + interior refresh upgraded to monthly (was
//                  quarterly in Owner Care); + brightwork polishing,
//                  monthly.
//
// The pricing engine has no native concept of service cadence — every
// selected service contributes its full price every time. To bill a
// quarterly service at its true monthly cost, MEMBERSHIP_BASELINE_BUNDLES
// pairs each code with a `monthlyFraction` (1 for monthly, 1/3 for
// quarterly), and buildCadenceAdjustedServices() multiplies that
// service's catalog price by the fraction before handing it to
// calculateEstimate() — the engine itself is untouched.
//
// Fleet/FBO has no fixed bundle — it's explicitly "Custom" pricing on
// the landing page — so it's rejected here rather than guessed at.
//
// Make sure STRIPE_SECRET_KEY and SITE_URL are set in your Netlify
// environment.
// ---------------------------------------------------------------------

import type { Handler } from "@netlify/functions";
import Stripe from "stripe";
import { loadPricingSettings } from "./pricing-settings";
import {
  MEMBERSHIP_BASELINE_BUNDLES,
  MEMBERSHIP_BASELINE_AIRCRAFT,
  buildCadenceAdjustedServices,
} from "../../src/lib/membership-tiers";
import { calculateEstimate } from "../../src/lib/pricing-engine";
import type { MembershipTier } from "../../src/types";
import { createPostHogClient } from "./posthog-client";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2026-06-24.dahlia",
});

const MEMBERSHIP_DISPLAY_NAME: Record<MembershipTier, string> = {
  ramp_ready: "Ramp Ready",
  owner_care: "Owner Care",
  preservation: "Preservation",
  fleet_fbo: "Fleet / FBO",
};

// Bundle definitions, baseline aircraft, and cadence-adjustment logic
// are now in src/lib/membership-tiers.ts — shared with Memberships.tsx
// so the landing page display and the Stripe charge always compute from
// the same source and can never diverge.

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

  const tier = body.tier;
  if (typeof tier !== "string" || !(tier in MEMBERSHIP_DISPLAY_NAME)) {
    return badRequest(`tier must be one of: ${Object.keys(MEMBERSHIP_DISPLAY_NAME).join(", ")}`);
  }

  // Required so stripe-webhook.ts can later link this subscription back
  // to a memberships row (memberships.client_id is a real FK to
  // profiles, unlike custom_quotes' mock client ids) — there is no other
  // identifying info available once Stripe sends async webhook events.
  const clientId = body.clientId;
  if (typeof clientId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clientId)) {
    return badRequest("clientId must be a UUID");
  }

  const bundle = MEMBERSHIP_BASELINE_BUNDLES[tier as MembershipTier];
  if (!bundle) {
    return badRequest(
      "Fleet/FBO membership is custom-quoted and isn't available as a self-serve subscription — request a quote instead"
    );
  }

  try {
    const { services, pricingConfig, source } = await loadPricingSettings();
    const cadenceAdjustedServices = buildCadenceAdjustedServices(services, bundle);

    const estimate = calculateEstimate(
      { ...MEMBERSHIP_BASELINE_AIRCRAFT, services: bundle.map((b) => b.code) },
      cadenceAdjustedServices,
      pricingConfig,
      { membershipTier: tier as MembershipTier }
    );

    if (estimate.total <= 0) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: `Computed $0 monthly price for tier ${tier} — check the service catalog pricing` }),
      };
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: `${MEMBERSHIP_DISPLAY_NAME[tier as MembershipTier]} Membership` },
            recurring: { interval: "month" },
            unit_amount: Math.round(estimate.total * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.SITE_URL}/portal/membership?updated=1`,
      cancel_url: `${process.env.SITE_URL}/portal/membership`,
      metadata: { tier, clientId, pricingSource: source },
    });

    if (!session.url) {
      return { statusCode: 500, body: "Failed to create Stripe subscription session" };
    }

    const posthog = createPostHogClient();
    posthog.capture({
      distinctId: clientId as string,
      event: "membership checkout started",
      properties: {
        tier,
        monthly_amount: estimate.total,
        pricing_source: source,
      },
    });
    await posthog.shutdown();

    return { statusCode: 200, body: JSON.stringify({ url: session.url, amount: estimate.total }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: (err as Error).message }) };
  }
};
