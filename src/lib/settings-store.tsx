import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type {
  AircraftCategory,
  AircraftCondition,
  BackgroundSettings,
  BusinessAddress,
  BusinessSettings,
  CustomQuote,
  DiscountRule,
  GalleryPhotoPair,
  GallerySettings,
  InvoiceSettings,
  MembershipTier,
  OnboardingState,
  PricingConfig,
  ServiceDefinition,
} from "@/types";
import { DEFAULT_DISCOUNT_RULES, DEFAULT_PRICING_CONFIG, DEFAULT_SERVICES } from "@/lib/pricing-engine";
import { DEFAULT_SAMPLE_ID } from "@/lib/sample-backgrounds";
import { supabase } from "@/lib/supabase-client";

const STORAGE_KEY = "brightwork-settings-v2";

export const DEFAULT_BACKGROUND: BackgroundSettings = {
  mode: "sample",
  solidColorHex: "#1a1f2e",
  sampleId: DEFAULT_SAMPLE_ID,
  customDataUrl: null,
};

export const DEFAULT_GALLERY: GallerySettings = {
  enabled: false,
  photos: [],
};

export const DEFAULT_ONBOARDING: OnboardingState = {
  setupCompleted: false,
  tourDismissed: false,
};

export const DEFAULT_BUSINESS_SETTINGS: BusinessSettings = {
  companyName: "Brightwork",
  tagline: "Aircraft Appearance & Preservation Services",
  logoDataUrl: null,
  contactEmail: "hello@brightworkaero.com",
  contactPhone: "(800) 467-2331",
  serviceArea: "Mobile service — CA Central Valley & Bay Area",
  accentColorHex: "#E8A33D",
  entityType: "sole_proprietorship",
  address: { street: "", city: "", state: "", zip: "" },
  aboutUs: "",
  background: DEFAULT_BACKGROUND,
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
  gallery: GallerySettings;
  onboarding: OnboardingState;
}

function mergeBusinessSettings(partial?: Partial<BusinessSettings>): BusinessSettings {
  const base = { ...DEFAULT_BUSINESS_SETTINGS, ...partial };
  const background = migrateBackground({ ...DEFAULT_BACKGROUND, ...partial?.background });
  return {
    ...base,
    address: { ...DEFAULT_BUSINESS_SETTINGS.address, ...partial?.address },
    background,
    invoice: { ...DEFAULT_BUSINESS_SETTINGS.invoice, ...partial?.invoice },
  };
}

/** Upgrade users still on the old solid-color factory default to the premium jet hero. */
function migrateBackground(bg: BackgroundSettings): BackgroundSettings {
  const isLegacySolidDefault =
    bg.mode === "solid" &&
    bg.solidColorHex === "#1a1f2e" &&
    (bg.sampleId === "runway-golden-hour" || bg.sampleId === DEFAULT_SAMPLE_ID);

  if (isLegacySolidDefault) {
    return DEFAULT_BACKGROUND;
  }

  return {
    ...DEFAULT_BACKGROUND,
    ...bg,
  };
}

function loadInitialState(): SettingsState {
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem("brightwork-settings-v1");
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SettingsState>;
        return {
          businessSettings: mergeBusinessSettings(parsed.businessSettings),
          services: parsed.services?.length ? parsed.services : DEFAULT_SERVICES,
          pricingConfig: { ...DEFAULT_PRICING_CONFIG, ...parsed.pricingConfig },
          discountRules: parsed.discountRules ?? DEFAULT_DISCOUNT_RULES,
          customQuotes: parsed.customQuotes ?? [],
          gallery: { ...DEFAULT_GALLERY, ...parsed.gallery, photos: parsed.gallery?.photos ?? [] },
          onboarding: { ...DEFAULT_ONBOARDING, ...parsed.onboarding },
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
    gallery: DEFAULT_GALLERY,
    onboarding: DEFAULT_ONBOARDING,
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
  updateAddress: (patch: Partial<BusinessAddress>) => void;
  updateBackground: (patch: Partial<BackgroundSettings>) => void;

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
  /** The only transition that makes a quote payable. Writes through to
   * Supabase (create-checkout-session.ts reads from there, not
   * localStorage) before flipping local state — if the write fails, the
   * quote stays un-verified rather than silently claiming to be locked
   * in. Throws on failure so the caller can show an error. */
  verifyCustomQuote: (id: string) => Promise<void>;

  setGalleryEnabled: (enabled: boolean) => void;
  addGalleryPhoto: (photo: Omit<GalleryPhotoPair, "id">) => void;
  updateGalleryPhoto: (id: string, patch: Partial<GalleryPhotoPair>) => void;
  removeGalleryPhoto: (id: string) => void;

  completeSetup: () => void;
  dismissSetupTour: () => void;
  resetOnboarding: () => void;

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
        setState((s) => ({ ...s, businessSettings: mergeBusinessSettings({ ...s.businessSettings, ...patch }) })),

      updateInvoiceSettings: (patch) =>
        setState((s) => ({
          ...s,
          businessSettings: mergeBusinessSettings({
            ...s.businessSettings,
            invoice: { ...s.businessSettings.invoice, ...patch },
          }),
        })),

      updateAddress: (patch) =>
        setState((s) => ({
          ...s,
          businessSettings: mergeBusinessSettings({
            ...s.businessSettings,
            address: { ...s.businessSettings.address, ...patch },
          }),
        })),

      updateBackground: (patch) =>
        setState((s) => ({
          ...s,
          businessSettings: mergeBusinessSettings({
            ...s.businessSettings,
            background: { ...s.businessSettings.background, ...patch },
          }),
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

      verifyCustomQuote: async (id) => {
        const quote = state.customQuotes.find((q) => q.id === id);
        if (!quote) throw new Error("Quote not found");

        const verifiedAt = new Date().toISOString();
        const { error } = await supabase.from("custom_quotes").upsert({
          id: quote.id,
          client_id: quote.clientId,
          client_name: quote.clientName,
          request_id: quote.requestId ?? null,
          line_items: quote.lineItems,
          applied_discount_ids: quote.appliedDiscountIds,
          notes: quote.notes ?? null,
          subtotal: quote.subtotal,
          discount_total: quote.discountTotal,
          total: quote.total,
          status: "verified",
          verified_at: verifiedAt,
          created_at: quote.createdAt,
        });
        if (error) throw error;

        setState((s) => ({
          ...s,
          customQuotes: s.customQuotes.map((q) => (q.id === id ? { ...q, status: "verified", verifiedAt } : q)),
        }));
      },

      setGalleryEnabled: (enabled) =>
        setState((s) => ({ ...s, gallery: { ...s.gallery, enabled } })),

      addGalleryPhoto: (photo) =>
        setState((s) => ({
          ...s,
          gallery: { ...s.gallery, photos: [...s.gallery.photos, { ...photo, id: crypto.randomUUID() }] },
        })),

      updateGalleryPhoto: (id, patch) =>
        setState((s) => ({
          ...s,
          gallery: {
            ...s.gallery,
            photos: s.gallery.photos.map((p) => (p.id === id ? { ...p, ...patch } : p)),
          },
        })),

      removeGalleryPhoto: (id) =>
        setState((s) => ({
          ...s,
          gallery: { ...s.gallery, photos: s.gallery.photos.filter((p) => p.id !== id) },
        })),

      completeSetup: () =>
        setState((s) => ({
          ...s,
          onboarding: { setupCompleted: true, tourDismissed: true },
        })),

      dismissSetupTour: () =>
        setState((s) => ({
          ...s,
          onboarding: { ...s.onboarding, tourDismissed: true },
        })),

      resetOnboarding: () =>
        setState((s) => ({
          ...s,
          onboarding: DEFAULT_ONBOARDING,
        })),

      resetToDefaults: () =>
        setState({
          businessSettings: DEFAULT_BUSINESS_SETTINGS,
          services: DEFAULT_SERVICES,
          pricingConfig: DEFAULT_PRICING_CONFIG,
          discountRules: DEFAULT_DISCOUNT_RULES,
          customQuotes: [],
          gallery: DEFAULT_GALLERY,
          onboarding: DEFAULT_ONBOARDING,
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
