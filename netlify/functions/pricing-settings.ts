import { createClient } from "@supabase/supabase-js";
import type {
  DiscountRule,
  PricingConfig,
  ServiceDefinition,
} from "../../src/types";
import {
  DEFAULT_DISCOUNT_RULES,
  DEFAULT_PRICING_CONFIG,
  DEFAULT_SERVICES,
} from "../../src/lib/pricing-engine";

export interface PricingSettings {
  services: ServiceDefinition[];
  pricingConfig: PricingConfig;
  discountRules: DiscountRule[];
  source: "supabase" | "defaults";
}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

export function createSupabaseAdminClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase admin credentials are not configured for server-side pricing.");
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

function parseService(row: any): ServiceDefinition {
  return {
    code: String(row.code),
    name: String(row.name),
    description: String(row.description ?? ""),
    category: row.category as ServiceDefinition["category"],
    startingPrice:
      row.starting_price != null
        ? Number(row.starting_price)
        : row.startingPrice != null
        ? Number(row.startingPrice)
        : null,
    availability: row.availability as ServiceDefinition["availability"],
    unit: row.unit as ServiceDefinition["unit"],
  };
}

function parsePricingConfig(row: any): PricingConfig {
  const parseJson = (value: any) => {
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  };

  return {
    sizeMultiplier: parseJson(row.size_multiplier ?? row.sizeMultiplier),
    categoryComplexityMultiplier: parseJson(
      row.category_complexity_multiplier ?? row.categoryComplexityMultiplier
    ),
    conditionModifier: parseJson(row.condition_modifier ?? row.conditionModifier),
    membershipDiscount: parseJson(row.membership_discount ?? row.membershipDiscount),
    travelRules: parseJson(row.travel_rules ?? row.travelRules),
    blendedHourlyRate: Number(row.blended_hourly_rate ?? row.blendedHourlyRate),
    confidenceVariance: parseJson(row.confidence_variance ?? row.confidenceVariance),
  };
}

function parseDiscountRule(row: any): DiscountRule {
  return {
    id: String(row.id),
    label: String(row.label),
    scope: row.scope as DiscountRule["scope"],
    valueType: row.value_type ?? row.valueType,
    value: Number(row.value),
    active: Boolean(row.active),
    startDate: row.start_date ?? row.startDate ?? undefined,
    endDate: row.end_date ?? row.endDate ?? undefined,
    minServicesForBundle:
      row.min_services_for_bundle != null
        ? Number(row.min_services_for_bundle)
        : row.minServicesForBundle != null
        ? Number(row.minServicesForBundle)
        : undefined,
    minCompletedServices:
      row.min_completed_services != null
        ? Number(row.min_completed_services)
        : row.minCompletedServices != null
        ? Number(row.minCompletedServices)
        : undefined,
    notes: row.notes ?? undefined,
  };
}

function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}

export async function loadPricingSettings(): Promise<PricingSettings> {
  if (!isSupabaseConfigured()) {
    return {
      services: DEFAULT_SERVICES,
      pricingConfig: DEFAULT_PRICING_CONFIG,
      discountRules: DEFAULT_DISCOUNT_RULES,
      source: "defaults",
    };
  }

  const supabase = createSupabaseAdminClient();

  try {
    const [{ data: servicesData, error: servicesError }, { data: pricingConfigData, error: pricingConfigError }, { data: discountRulesData, error: discountRulesError }] =
      await Promise.all([
        supabase.from("services").select("*").order("code", { ascending: true }),
        supabase.from("pricing_config").select("*").limit(1).single(),
        supabase.from("discount_rules").select("*").order("id", { ascending: true }),
      ]);

    if (servicesError || pricingConfigError || discountRulesError) {
      throw new Error(
        `Pricing table load failed: ${servicesError?.message ?? ""} ${pricingConfigError?.message ?? ""} ${discountRulesError?.message ?? ""}`.trim()
      );
    }

    if (!servicesData || !pricingConfigData || !discountRulesData) {
      throw new Error("Pricing tables returned empty results.");
    }

    return {
      services: servicesData.map(parseService),
      pricingConfig: parsePricingConfig(pricingConfigData),
      discountRules: discountRulesData.map(parseDiscountRule),
      source: "supabase",
    };
  } catch (err) {
    return {
      services: DEFAULT_SERVICES,
      pricingConfig: DEFAULT_PRICING_CONFIG,
      discountRules: DEFAULT_DISCOUNT_RULES,
      source: "defaults",
    };
  }
}
