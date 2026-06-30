// Pricing rule engine
// ------------------------------------------------------------------
// Every number that affects price is data, not code — a service's price,
// the aircraft multipliers, and discount rules are all editable from the
// Admin > Services / Pricing Rules / Discounts screens (see
// src/lib/settings-store.tsx) so this app can be re-used by a different
// detailing business without touching this file. The constants exported
// here are only the factory defaults a brand-new tenant starts from.
//
// Pipeline (matches the business's rule diagram):
//   Base Price (per selected service, from the service catalog)
//     -> Aircraft Size Multiplier
//     -> Aircraft Category Multiplier
//     -> Aircraft Condition Modifier(s)
//     -> Service Package + Add-ons (every selected service contributes a line)
//     -> Travel Fee
//     -> Membership Discount
//     -> Promotional / Repeat-Customer / Package Discounts
//     -> Estimated Labor Hours
//     -> Estimated Price Range
// ------------------------------------------------------------------

import type {
  AircraftCategory,
  AircraftCondition,
  DiscountRule,
  EstimateInput,
  EstimateResult,
  MembershipTier,
  PricingConfig,
  PricingLineItem,
  ServiceDefinition,
} from "@/types";

export const DEFAULT_SERVICES: ServiceDefinition[] = [
  {
    code: "exterior_wash",
    name: "Exterior Aircraft Wash",
    description: "Hand wash of fuselage, wings, and tail surfaces.",
    category: "launch",
    startingPrice: 575,
    availability: "available",
    unit: "flat",
  },
  {
    code: "interior_refresh",
    name: "Interior Refresh",
    description: "Cabin vacuum, surface wipe-down, and window interior clean.",
    category: "launch",
    startingPrice: 375,
    availability: "available",
    unit: "flat",
  },
  {
    code: "belly_cleaning",
    name: "Belly Cleaning",
    description: "Degreasing and cleaning of the lower fuselage.",
    category: "launch",
    startingPrice: 235,
    availability: "available",
    unit: "flat",
  },
  {
    code: "bug_exhaust_removal",
    name: "Bug & Exhaust Residue Removal",
    description: "Targeted removal of leading-edge bugs and exhaust soot.",
    category: "launch",
    startingPrice: 150,
    availability: "available",
    unit: "flat",
  },
  {
    code: "brightwork_polish",
    name: "Brightwork Polishing",
    description: "Polishing of exposed polished metal trim and accents.",
    category: "launch",
    startingPrice: 395,
    availability: "available",
    unit: "flat",
  },
  {
    code: "presale_cleanup",
    name: "Pre-Sale Appearance Cleanup",
    description: "Full appearance pass to prepare an aircraft for listing photos and showing.",
    category: "launch",
    startingPrice: 1595,
    availability: "available",
    unit: "flat",
  },
  {
    code: "complete_detail",
    name: "Complete Detail",
    description: "Exterior wash, interior refresh, and belly cleaning bundled together.",
    category: "launch",
    startingPrice: 999,
    availability: "available",
    unit: "flat",
  },
  {
    code: "ceramic_coating",
    name: "Ceramic Coating",
    description: "Protective ceramic coating applied to exterior painted surfaces.",
    category: "advanced",
    startingPrice: 2650,
    availability: "limited",
    unit: "flat",
  },
  {
    code: "paint_enhancement",
    name: "Paint Enhancement",
    description: "Light machine polish to restore gloss without full paint correction.",
    category: "advanced",
    startingPrice: 850,
    availability: "limited",
    unit: "flat",
  },
  {
    code: "paint_correction",
    name: "Paint Correction",
    description: "Defect and oxidation correction prior to coating or sale.",
    category: "advanced",
    startingPrice: 1450,
    availability: "limited",
    unit: "flat",
  },
  {
    code: "deice_boot_restoration",
    name: "De-Ice Boot Restoration",
    description: "Cleaning and conditioning of leading-edge de-ice boots.",
    category: "advanced",
    startingPrice: 450,
    availability: "limited",
    unit: "flat",
  },
  {
    code: "window_polishing",
    name: "Window Polishing",
    description: "Polishing of acrylic windows to reduce haze and fine scratches.",
    category: "advanced",
    startingPrice: 415,
    availability: "limited",
    unit: "flat",
  },
  {
    code: "odor_treatment",
    name: "Odor Treatment",
    description: "Cabin odor neutralization treatment.",
    category: "advanced",
    startingPrice: 250,
    availability: "limited",
    unit: "flat",
  },
  {
    code: "sanitization",
    name: "Sanitization / Disinfection",
    description: "Cabin surface disinfection pass.",
    category: "advanced",
    startingPrice: 200,
    availability: "limited",
    unit: "flat",
  },
  {
    code: "disinsection_coordination",
    name: "Disinsection Coordination",
    description: "Coordination with an approved provider for regulatory disinsection.",
    category: "advanced",
    startingPrice: null,
    availability: "referral_only",
    unit: "quote",
  },
  {
    code: "fleet_preservation",
    name: "Fleet Preservation Programs",
    description: "Recurring appearance preservation across a managed fleet.",
    category: "advanced",
    startingPrice: null,
    availability: "coming_soon",
    unit: "quote",
  },
  {
    code: "leather_conditioning",
    name: "Leather Conditioning",
    description: "Cleaning and conditioning of leather seating surfaces.",
    category: "advanced",
    startingPrice: 325,
    availability: "available",
    unit: "flat",
  },
  {
    code: "membership_quote",
    name: "Membership Quote",
    description: "Get pricing for a recurring care plan instead of a one-time service.",
    category: "advanced",
    startingPrice: null,
    availability: "available",
    unit: "quote",
  },
];

export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  sizeMultiplier: {
    piston_single: 1.0,
    piston_twin: 1.3,
    turboprop: 1.6,
    light_jet: 1.8,
    mid_size_jet: 2.3,
    heavy_jet: 3.0,
    helicopter: 1.1,
    experimental: 0.9,
    warbird: 1.4,
    other: 1.5,
  },
  categoryComplexityMultiplier: {
    piston_single: 1.0,
    piston_twin: 1.05,
    turboprop: 1.1,
    light_jet: 1.15,
    mid_size_jet: 1.2,
    heavy_jet: 1.3,
    helicopter: 1.25,
    experimental: 1.1,
    warbird: 1.35,
    other: 1.1,
  },
  conditionModifier: {
    excellent: 0.95,
    good: 1.0,
    average: 1.05,
    heavy_bugs: 1.1,
    heavy_oxidation: 1.2,
    oil_leaks: 1.12,
    stored_outside: 1.15,
    hangared: 0.97,
    recently_painted: 0.95,
  },
  membershipDiscount: {
    ramp_ready: 0.1,
    owner_care: 0.15,
    preservation: 0.2,
    fleet_fbo: 0.2,
  },
  travelRules: { freeRadiusMiles: 15, ratePerMile: 3 },
  blendedHourlyRate: 65,
  confidenceVariance: { high: 0.08, medium: 0.15, low: 0.25 },
};

export const DEFAULT_DISCOUNT_RULES: DiscountRule[] = [
  {
    id: "disc-holiday-seed",
    label: "4th of July Special",
    scope: "holiday",
    valueType: "percentage",
    value: 15,
    active: true,
    startDate: "2026-07-04",
    endDate: "2026-07-06",
    notes: "15% off all services — book by July 6, 2026.",
  },
  {
    id: "disc-repeat-seed",
    label: "Repeat Customer",
    scope: "repeat_customer",
    valueType: "percentage",
    value: 10,
    active: true,
    minCompletedServices: 3,
    notes: "Applies automatically once a client has 3+ completed services.",
  },
  {
    id: "disc-bundle-seed",
    label: "Multi-Service Bundle",
    scope: "package_deal",
    valueType: "percentage",
    value: 8,
    active: true,
    minServicesForBundle: 3,
    notes: "Applies automatically when 3 or more services are selected together.",
  },
];

function round5(n: number): number {
  return Math.round(n / 5) * 5;
}

export function getConfidence(input: EstimateInput): "high" | "medium" | "low" {
  let score = 0;
  if (input.tailNumber && input.tailNumber.trim().length >= 4) score += 1;
  if (input.photoCount >= 3) score += 1;
  if (input.condition.length > 0 && input.condition.length <= 2) score += 1;
  if (input.airport.trim().length > 0) score += 1;
  if (score >= 3) return "high";
  if (score >= 1) return "medium";
  return "low";
}

export interface DiscountContext {
  membershipTier?: MembershipTier;
  discountRules?: DiscountRule[];
  /** Known completed-service count for the client this estimate is for —
   * omit for anonymous/public estimates, since "repeat customer" discounts
   * require knowing who the client is. */
  completedServiceCount?: number;
  /** Override "today" for holiday-window checks — mainly useful for tests. */
  today?: Date;
}

function isHolidayActiveToday(rule: DiscountRule, today: Date): boolean {
  if (!rule.startDate || !rule.endDate) return false;
  const t = today.getTime();
  return t >= new Date(rule.startDate).getTime() && t <= new Date(rule.endDate).getTime();
}

/** Evaluates which discount rules apply to a given subtotal / selection and
 * returns the combined discount plus a transparent line-item breakdown. */
export function applyDiscountRules(
  subtotal: number,
  selectedServiceCount: number,
  ctx: DiscountContext = {}
): { total: number; applied: { label: string; amount: number }[] } {
  const rules = ctx.discountRules ?? [];
  const today = ctx.today ?? new Date();
  const applied: { label: string; amount: number }[] = [];
  let runningSubtotal = subtotal;
  let discountTotal = 0;

  for (const rule of rules) {
    if (!rule.active) continue;

    let matches = false;
    if (rule.scope === "holiday") matches = isHolidayActiveToday(rule, today);
    if (rule.scope === "package_deal") {
      matches = !!rule.minServicesForBundle && selectedServiceCount >= rule.minServicesForBundle;
    }
    if (rule.scope === "repeat_customer") {
      matches =
        ctx.completedServiceCount !== undefined &&
        !!rule.minCompletedServices &&
        ctx.completedServiceCount >= rule.minCompletedServices;
    }
    // "manual" rules are never auto-applied — they're chosen explicitly in
    // the admin custom quote builder.
    if (!matches) continue;

    const amount = rule.valueType === "percentage" ? runningSubtotal * (rule.value / 100) : rule.value;
    discountTotal += amount;
    applied.push({ label: rule.label, amount: Math.round(amount) });
  }

  return { total: Math.round(subtotal - discountTotal), applied };
}

/** Same size + category-complexity multiplier math calculateEstimate
 * applies per-service internally (steps 1-3), exposed standalone so a
 * caller that needs one service's base price on its own — e.g. the
 * Report Builder's per-service price line, which an admin then adjusts
 * up/down — doesn't have to duplicate the formula or run the full
 * estimate pipeline (condition modifiers, travel, discounts) just to get
 * a single starting number. */
export function calculateServiceBasePrice(
  service: ServiceDefinition,
  category: AircraftCategory,
  config: PricingConfig
): number {
  if (service.startingPrice === null) return 0;
  return service.startingPrice * config.sizeMultiplier[category] * config.categoryComplexityMultiplier[category];
}

/** Runs the full pricing pipeline and returns a price range, labor hours,
 * confidence, and a line-item breakdown for transparency. */
export function calculateEstimate(
  input: EstimateInput,
  services: ServiceDefinition[],
  config: PricingConfig,
  ctx: DiscountContext = {}
): EstimateResult {
  const breakdown: PricingLineItem[] = [];

  const selected = input.services
    .map((code) => services.find((s) => s.code === code))
    .filter((s): s is ServiceDefinition => !!s && s.code !== "membership_quote" && s.startingPrice !== null);

  if (selected.length === 0) {
    return {
      total: 0,
      low: 0,
      high: 0,
      laborHoursLow: 0,
      laborHoursHigh: 0,
      recommendedPackage: "Complete Detail",
      recommendedAddOns: [],
      confidence: "low",
      breakdown: [],
      appliedDiscounts: [],
    };
  }

  // Step 1-3: base price, size multiplier, category complexity multiplier
  // applied per selected service.
  let runningTotal = 0;
  for (const service of selected) {
    const base = service.startingPrice as number;
    const sized = base * config.sizeMultiplier[input.category];
    const adjusted = sized * config.categoryComplexityMultiplier[input.category];
    runningTotal += adjusted;
    breakdown.push({ label: service.name, amount: Math.round(adjusted), kind: "base" });
  }

  // Step 4: condition modifiers stack multiplicatively across the whole total.
  let conditionMultiplier = 1;
  for (const c of input.condition) {
    conditionMultiplier *= config.conditionModifier[c];
  }
  if (conditionMultiplier !== 1) {
    const before = runningTotal;
    runningTotal *= conditionMultiplier;
    breakdown.push({
      label: "Condition adjustment",
      amount: Math.round(runningTotal - before),
      kind: "multiplier",
    });
  }

  // Step 5/6: service package + add-ons are already summed above since every
  // selected service contributes its own line; no further action needed.

  // Step 7: travel fee.
  const billableMiles = Math.max(0, input.travelDistanceMiles - config.travelRules.freeRadiusMiles);
  const travelFee = billableMiles * config.travelRules.ratePerMile;
  if (travelFee > 0) {
    runningTotal += travelFee;
    breakdown.push({ label: "Travel fee", amount: Math.round(travelFee), kind: "fee" });
  }

  // Step 8: membership discount.
  if (ctx.membershipTier) {
    const discount = runningTotal * config.membershipDiscount[ctx.membershipTier];
    runningTotal -= discount;
    breakdown.push({ label: "Membership discount", amount: -Math.round(discount), kind: "discount" });
  }

  // Step 8b: promotional / repeat-customer / package discounts.
  const { total: afterDiscounts, applied } = applyDiscountRules(runningTotal, selected.length, ctx);
  for (const d of applied) {
    breakdown.push({ label: d.label, amount: -d.amount, kind: "discount" });
  }
  runningTotal = afterDiscounts;

  // Step 9: labor hours, derived from the blended shop rate.
  const baseHours = runningTotal / config.blendedHourlyRate;
  const laborHoursLow = Math.max(1, Math.round(baseHours * 0.85 * 2) / 2);
  const laborHoursHigh = Math.max(laborHoursLow, Math.round(baseHours * 1.15 * 2) / 2);

  // Step 10: confidence-driven range.
  const confidence = getConfidence(input);
  const variance = config.confidenceVariance[confidence];
  const low = round5(runningTotal * (1 - variance));
  const high = round5(runningTotal * (1 + variance));

  const recommendedPackage = recommendPackage(selected);
  const recommendedAddOns = recommendAddOns(selected, input.condition, services);

  return {
    total: Math.round(runningTotal),
    low,
    high,
    laborHoursLow,
    laborHoursHigh,
    recommendedPackage,
    recommendedAddOns,
    confidence,
    breakdown,
    appliedDiscounts: applied,
  };
}

function recommendPackage(selected: ServiceDefinition[]): string {
  const launchCodes = ["exterior_wash", "interior_refresh", "belly_cleaning"];
  const selectedLaunchCount = selected.filter((s) => launchCodes.includes(s.code)).length;
  if (selectedLaunchCount >= 2 && !selected.some((s) => s.code === "complete_detail")) {
    return "Complete Detail";
  }
  return selected[0]?.name ?? "Complete Detail";
}

function recommendAddOns(
  selected: ServiceDefinition[],
  conditions: AircraftCondition[],
  catalog: ServiceDefinition[]
): string[] {
  const codes = selected.map((s) => s.code);
  const nameOf = (code: string) => catalog.find((s) => s.code === code)?.name ?? code;
  const suggestions: string[] = [];

  if (codes.includes("exterior_wash") && !codes.includes("belly_cleaning")) {
    suggestions.push(nameOf("belly_cleaning"));
  }
  if (codes.includes("exterior_wash") && !codes.includes("brightwork_polish")) {
    suggestions.push(nameOf("brightwork_polish"));
  }
  if (conditions.includes("heavy_oxidation") && !codes.includes("paint_correction")) {
    suggestions.push(nameOf("paint_correction"));
  }
  if (
    (codes.includes("paint_correction") || conditions.includes("recently_painted")) &&
    !codes.includes("ceramic_coating")
  ) {
    suggestions.push(nameOf("ceramic_coating"));
  }
  return Array.from(new Set(suggestions)).slice(0, 3);
}
