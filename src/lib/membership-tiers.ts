// Shared membership-tier definitions and monthly price computation.
//
// Imported by TWO consumers — keep this file free of React, browser-only
// APIs, and Netlify-only modules so both can import it cleanly:
//   1. src/pages/landing/Memberships.tsx (React, client-side)
//   2. netlify/functions/create-subscription-session.ts (Node, serverless)
//
// Previously, create-subscription-session.ts owned the bundle definitions
// and the landing page hardcoded matching prices as literal strings. Any
// service price change would silently break that match, showing a different
// number on the landing page than Stripe would actually charge. This module
// is the fix: both consumers derive the monthly price from the same math.

import { calculateEstimate } from "./pricing-engine";
import type {
  EstimateInput,
  MembershipTier,
  PricingConfig,
  ServiceDefinition,
} from "@/types";

interface BundleEntry {
  code: string;
  /** Fraction of the service's full catalog price billed per month — 1
   * for a monthly service, 1/3 for a quarterly one, etc. See the
   * "minimal escalation" rationale in create-subscription-session.ts. */
  monthlyFraction: number;
}

/** Per-tier service bundle contents. fleet_fbo has no bundle: it's sold
 * as a custom quote, not a fixed self-serve price. */
export const MEMBERSHIP_BASELINE_BUNDLES: Partial<Record<MembershipTier, BundleEntry[]>> = {
  ramp_ready: [{ code: "exterior_wash", monthlyFraction: 1 }],
  owner_care: [
    { code: "exterior_wash", monthlyFraction: 1 },
    { code: "bug_exhaust_removal", monthlyFraction: 1 },
    { code: "interior_refresh", monthlyFraction: 1 / 3 },
  ],
  preservation: [
    { code: "exterior_wash", monthlyFraction: 1 },
    { code: "bug_exhaust_removal", monthlyFraction: 1 },
    { code: "interior_refresh", monthlyFraction: 1 },
    { code: "brightwork_polish", monthlyFraction: 1 },
  ],
};

/** Baseline aircraft used for the representative price computation —
 * piston single, good condition, no travel. The membership discount
 * configured in PricingConfig is applied on top. */
export const MEMBERSHIP_BASELINE_AIRCRAFT: Omit<EstimateInput, "services"> = {
  category: "piston_single",
  make: "",
  model: "",
  condition: ["good"],
  airport: "",
  rampParked: false,
  travelDistanceMiles: 0,
  photoCount: 0,
};

/** Scales each bundle member's catalog price by its monthly cadence
 * fraction before passing the catalog to calculateEstimate(). This lets
 * the pricing engine's size/category/condition/discount math apply on top
 * of the correctly-amortised base price. */
export function buildCadenceAdjustedServices(
  catalog: ServiceDefinition[],
  bundle: BundleEntry[]
): ServiceDefinition[] {
  const fractionByCode = new Map(bundle.map((b) => [b.code, b.monthlyFraction]));
  return catalog.map((s) => {
    const fraction = fractionByCode.get(s.code);
    if (fraction === undefined || s.startingPrice === null) return s;
    return { ...s, startingPrice: s.startingPrice * fraction };
  });
}

/** Returns the computed monthly price (in dollars) for a membership tier
 * using the provided service catalog and pricing config. Returns null for
 * fleet_fbo (custom-quoted) and undefined tier inputs. */
export function computeMembershipMonthlyPrice(
  tier: MembershipTier,
  catalog: ServiceDefinition[],
  config: PricingConfig
): number | null {
  const bundle = MEMBERSHIP_BASELINE_BUNDLES[tier];
  if (!bundle) return null; // fleet_fbo — no fixed price

  const adjustedCatalog = buildCadenceAdjustedServices(catalog, bundle);
  const estimate = calculateEstimate(
    { ...MEMBERSHIP_BASELINE_AIRCRAFT, services: bundle.map((b) => b.code) },
    adjustedCatalog,
    config,
    { membershipTier: tier }
  );
  return estimate.total;
}
