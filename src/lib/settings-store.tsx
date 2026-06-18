import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type {
  AircraftCategory,
  AircraftCondition,
  BusinessSettings,
  CustomQuote,
  DiscountRule,
  InvoiceSettings,
  MembershipTier,
  PricingConfig,
  ServiceDefinition,
} from "@/types";
import { DEFAULT_DISCOUNT_RULES, DEFAULT_PRICING_CONFIG, DEFAULT_SERVICES } from "@/lib/pricing-engine";

const STORAGE_KEY = "brightwork-settings-v1";

export const DEFAULT_BUSINESS_SETTINGS: BusinessSettings = {
  companyName: "Brightwork",
  tagline: "Aircraft Appearance & Preservation Services",
  logoDataUrl: null,
  contactEmail: "hello@brightworkaero.com",
  contactPhone: "(916) 555-0148",
  serviceArea: "Mobile service — CA Central Valley & Bay Area",
  accentColorHex: "#E8A33D",
  customDisclaimerNote: "",
  invoice: {
    invoicePrefix: "BW",
    taxRatePercent: 0,
    depositPercent: 25,
    paymentTermsDays: 14,
    lateFeePercent: 1.5,
    footerNote: "Thank you for trusting us with your aircraft.",
  },
};

interface SettingsState {
  businessSettings: BusinessSettings;
  services: ServiceDefinition[];
  pricingConfig: PricingConfig;
  discountRules: DiscountRule[];
  customQuotes: CustomQuote[];
}

function loadInitialState(): SettingsState {
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SettingsState>;
        return {
          businessSettings: { ...DEFAULT_BUSINESS_SETTINGS, ...parsed.businessSettings },
          services: parsed.services?.length ? parsed.services : DEFAULT_SERVICES,
          pricingConfig: { ...DEFAULT_PRICING_CONFIG, ...parsed.pricingConfig },
          discountRules: parsed.discountRules ?? DEFAULT_DISCOUNT_RULES,
          customQuotes: parsed.customQuotes ?? [],
        };
      }
    } catch {
      // fall through to defaults if localStorage is corrupted/unavailable
    }
  }
  return {
    businessSettings: DEFAULT_BUSINESS_SETTINGS,
    services: DEFAULT_SERVICES,
    pricingConfig: DEFAULT_PRICING_CONFIG,
    discountRules: DEFAULT_DISCOUNT_RULES,
    customQuotes: [],
  };
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

interface SettingsContextValue extends SettingsState {
  updateBusinessSettings: (patch: Partial<BusinessSettings>) => void;
  updateInvoiceSettings: (patch: Partial<InvoiceSettings>) => void;

  addService: (service: Omit<ServiceDefinition, "code">) => void;
  updateService: (code: string, patch: Partial<ServiceDefinition>) => void;
  removeService: (code: string) => void;

  updateSizeMultiplier: (category: AircraftCategory, value: number) => void;
  updateCategoryComplexityMultiplier: (category: AircraftCategory, value: number) => void;
  updateConditionModifier: (condition: AircraftCondition, value: number) => void;
  updateMembershipDiscount: (tier: MembershipTier, value: number) => void;
  updateTravelRules: (patch: Partial<PricingConfig["travelRules"]>) => void;
  updateBlendedHourlyRate: (value: number) => void;

  addDiscountRule: (rule: Omit<DiscountRule, "id">) => void;
  updateDiscountRule: (id: string, patch: Partial<DiscountRule>) => void;
  removeDiscountRule: (id: string) => void;

  addCustomQuote: (quote: Omit<CustomQuote, "id" | "createdAt">) => CustomQuote;
  updateCustomQuoteStatus: (id: string, status: CustomQuote["status"]) => void;

  resetToDefaults: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SettingsState>(loadInitialState);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // localStorage may be unavailable (private browsing, quota) — the app
      // still works for the current session, it just won't persist.
    }
  }, [state]);

  const value = useMemo<SettingsContextValue>(
    () => ({
      ...state,

      updateBusinessSettings: (patch) =>
        setState((s) => ({ ...s, businessSettings: { ...s.businessSettings, ...patch } })),

      updateInvoiceSettings: (patch) =>
        setState((s) => ({
          ...s,
          businessSettings: { ...s.businessSettings, invoice: { ...s.businessSettings.invoice, ...patch } },
        })),

      addService: (service) =>
        setState((s) => {
          let code = slugify(service.name) || `service_${s.services.length + 1}`;
          while (s.services.some((sv) => sv.code === code)) code = `${code}_2`;
          return { ...s, services: [...s.services, { ...service, code }] };
        }),

      updateService: (code, patch) =>
        setState((s) => ({
          ...s,
          services: s.services.map((sv) => (sv.code === code ? { ...sv, ...patch } : sv)),
        })),

      removeService: (code) =>
        setState((s) => ({ ...s, services: s.services.filter((sv) => sv.code !== code) })),

      updateSizeMultiplier: (category, value) =>
        setState((s) => ({
          ...s,
          pricingConfig: {
            ...s.pricingConfig,
            sizeMultiplier: { ...s.pricingConfig.sizeMultiplier, [category]: value },
          },
        })),

      updateCategoryComplexityMultiplier: (category, value) =>
        setState((s) => ({
          ...s,
          pricingConfig: {
            ...s.pricingConfig,
            categoryComplexityMultiplier: {
              ...s.pricingConfig.categoryComplexityMultiplier,
              [category]: value,
            },
          },
        })),

      updateConditionModifier: (condition, value) =>
        setState((s) => ({
          ...s,
          pricingConfig: {
            ...s.pricingConfig,
            conditionModifier: { ...s.pricingConfig.conditionModifier, [condition]: value },
          },
        })),

      updateMembershipDiscount: (tier, value) =>
        setState((s) => ({
          ...s,
          pricingConfig: {
            ...s.pricingConfig,
            membershipDiscount: { ...s.pricingConfig.membershipDiscount, [tier]: value },
          },
        })),

      updateTravelRules: (patch) =>
        setState((s) => ({
          ...s,
          pricingConfig: { ...s.pricingConfig, travelRules: { ...s.pricingConfig.travelRules, ...patch } },
        })),

      updateBlendedHourlyRate: (value) =>
        setState((s) => ({ ...s, pricingConfig: { ...s.pricingConfig, blendedHourlyRate: value } })),

      addDiscountRule: (rule) =>
        setState((s) => ({
          ...s,
          discountRules: [...s.discountRules, { ...rule, id: crypto.randomUUID() }],
        })),

      updateDiscountRule: (id, patch) =>
        setState((s) => ({
          ...s,
          discountRules: s.discountRules.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        })),

      removeDiscountRule: (id) =>
        setState((s) => ({ ...s, discountRules: s.discountRules.filter((r) => r.id !== id) })),

      addCustomQuote: (quote) => {
        const full: CustomQuote = { ...quote, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        setState((s) => ({ ...s, customQuotes: [full, ...s.customQuotes] }));
        return full;
      },

      updateCustomQuoteStatus: (id, status) =>
        setState((s) => ({
          ...s,
          customQuotes: s.customQuotes.map((q) => (q.id === id ? { ...q, status } : q)),
        })),

      resetToDefaults: () =>
        setState({
          businessSettings: DEFAULT_BUSINESS_SETTINGS,
          services: DEFAULT_SERVICES,
          pricingConfig: DEFAULT_PRICING_CONFIG,
          discountRules: DEFAULT_DISCOUNT_RULES,
          customQuotes: [],
        }),
    }),
    [state]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within a SettingsProvider");
  return ctx;
}
