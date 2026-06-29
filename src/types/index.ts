// Core domain types shared by the public site, client portal, and admin portal.
// These mirror the planned Supabase schema in /supabase/schema.sql.

export type Role = "client" | "admin";

export type AvailabilityStatus =
  | "available"
  | "limited"
  | "coming_soon"
  | "referral_only";

export type AircraftCategory =
  | "piston_single"
  | "piston_twin"
  | "turboprop"
  | "light_jet"
  | "mid_size_jet"
  | "heavy_jet"
  | "helicopter"
  | "experimental"
  | "warbird"
  | "other";

export type AircraftCondition =
  | "excellent"
  | "good"
  | "average"
  | "heavy_bugs"
  | "heavy_oxidation"
  | "oil_leaks"
  | "stored_outside"
  | "hangared"
  | "recently_painted";

// Service codes are plain strings (not a closed union) on purpose — this is
// a white-label app, and a detailer using it should be able to add brand
// new services from the admin panel without touching code. A handful of
// well-known codes ("exterior_wash", "membership_quote", etc.) are used as
// string literals in default seed data and a couple of recommendation
// heuristics, but nothing requires the set to stay fixed.
export type ServiceCode = string;

export interface ServiceDefinition {
  code: ServiceCode;
  name: string;
  description: string;
  category: "launch" | "advanced";
  /** The editable price used both for the public "starting at" display and
   * as the base price fed into the pricing engine. `null` = quote required. */
  startingPrice: number | null;
  availability: AvailabilityStatus;
  unit: "flat" | "quote";
}

export type RequestStatus =
  | "requested"
  | "quote_sent"
  | "approved"
  | "scheduled"
  | "in_progress"
  | "completed"
  | "paid"
  | "archived"
  | "cancelled";

export type ObservedIssueCategory =
  | "paint_chips"
  | "scratches"
  | "corrosion_observation"
  | "loose_missing_fastener"
  | "fluid_staining"
  | "tire_wheel_observation"
  | "window_condition"
  | "seal_trim_condition"
  | "interior_wear"
  | "other";

export interface Aircraft {
  id: string;
  ownerId: string;
  tailNumber: string;
  make: string;
  model: string;
  category: AircraftCategory;
  year?: number;
  homeAirport: string;
  hangared: boolean;
  notes?: string;
}

export interface RequestPhoto {
  id: string;
  requestId: string;
  /** Storage path within the aircraft-photos bucket, not a public URL —
   * the bucket is private, so this is resolved to a signed URL on demand. */
  url: string;
  caption?: string;
}

export interface ServiceRequest {
  id: string;
  aircraftId: string;
  clientId: string;
  services: ServiceCode[];
  status: RequestStatus;
  preferredDate?: string;
  /** Set by an admin once the request moves to "scheduled" — distinct from
   * preferredDate, which is just the client's original ask. */
  scheduledDate?: string;
  airportLocation: string;
  fboName?: string;
  notes?: string;
  /** An admin's price-adjustment justification and aircraft-condition
   * observations — deliberately separate from the client's own `notes`
   * above, and never shown in the client portal. */
  adminNotes?: string;
  estimateLow?: number;
  estimateHigh?: number;
  createdAt: string;
  photoCount?: number;
}

export interface Quote {
  id: string;
  requestId: string;
  amount: number;
  sentAt: string;
  expiresAt?: string;
  accepted: boolean;
}

export interface Invoice {
  id: string;
  clientId: string;
  requestId?: string;
  amount: number;
  depositAmount?: number;
  status: "unpaid" | "deposit_paid" | "paid" | "overdue";
  issuedAt: string;
  dueAt?: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: "card" | "ach" | "other";
  paidAt: string;
}

export type MembershipTier =
  | "ramp_ready"
  | "owner_care"
  | "preservation"
  | "fleet_fbo";

export interface Membership {
  id: string;
  clientId: string;
  tier: MembershipTier;
  monthlyAmount: number | null; // null => custom quote
  status: "active" | "paused" | "cancelled";
  startedAt: string;
}

export interface ReportPhoto {
  id: string;
  reportId: string;
  url: string;
  kind: "before" | "after" | "observed_issue";
  caption?: string;
}

export interface ObservedIssue {
  id: string;
  reportId: string;
  category: ObservedIssueCategory;
  note: string;
  photoId?: string;
}

export interface DetailingReport {
  id: string;
  aircraftId: string;
  clientId: string;
  serviceDate: string;
  location: string;
  servicesPerformed: ServiceCode[];
  productsUsed: string[];
  technicianNotes?: string;
  recommendations?: string;
  observedIssues: ObservedIssue[];
  photos: ReportPhoto[];
  disclaimer: string;
}

export interface ClientProfile {
  id: string;
  role: Role;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  /** Completed (non-cancelled) services in this client's history — used to
   * evaluate "repeat customer" discount rules. */
  completedServiceCount?: number;
}

// ---------------------------------------------------------------------
// White-label business customization
// ---------------------------------------------------------------------

export type BusinessEntityType = "sole_proprietorship" | "corporation";

export interface BusinessAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
}

export type BackgroundMode = "solid" | "sample" | "custom";

export interface BackgroundSettings {
  mode: BackgroundMode;
  solidColorHex: string;
  sampleId: string | null;
  customDataUrl: string | null;
}

export interface GalleryPhotoPair {
  id: string;
  label: string;
  beforeDataUrl: string;
  afterDataUrl: string;
}

export interface GallerySettings {
  enabled: boolean;
  photos: GalleryPhotoPair[];
}

export interface OnboardingState {
  setupCompleted: boolean;
  tourDismissed: boolean;
}

export interface InvoiceSettings {
  invoicePrefix: string;
  taxRatePercent: number;
  depositPercent: number;
  paymentTermsDays: number;
  lateFeePercent: number;
  footerNote: string;
}

export interface BusinessSettings {
  companyName: string;
  tagline: string;
  logoDataUrl: string | null;
  contactEmail: string;
  contactPhone: string;
  serviceArea: string;
  accentColorHex: string;
  entityType: BusinessEntityType;
  address: BusinessAddress;
  aboutUs: string;
  background: BackgroundSettings;
  /** Optional supplemental note shown alongside the required compliance
   * disclaimers — it cannot replace them (see REQUIRED_REPORT_DISCLAIMER /
   * ESTIMATE_DISCLAIMER below, which every tenant must keep). */
  customDisclaimerNote: string;
  invoice: InvoiceSettings;
}

export interface PricingConfig {
  sizeMultiplier: Record<AircraftCategory, number>;
  categoryComplexityMultiplier: Record<AircraftCategory, number>;
  conditionModifier: Record<AircraftCondition, number>;
  membershipDiscount: Record<MembershipTier, number>;
  travelRules: { freeRadiusMiles: number; ratePerMile: number };
  blendedHourlyRate: number;
  confidenceVariance: Record<"high" | "medium" | "low", number>;
}

export type DiscountScope = "holiday" | "repeat_customer" | "package_deal" | "manual";
export type DiscountValueType = "percentage" | "flat";

export interface DiscountRule {
  id: string;
  label: string;
  scope: DiscountScope;
  valueType: DiscountValueType;
  value: number;
  active: boolean;
  /** holiday: only applies within this date range (inclusive, ISO dates). */
  startDate?: string;
  endDate?: string;
  /** package_deal: applies once this many services are selected together. */
  minServicesForBundle?: number;
  /** repeat_customer: applies once a client has this many completed services. */
  minCompletedServices?: number;
  notes?: string;
}

export interface CustomQuoteLineItem {
  id: string;
  label: string;
  amount: number;
}

export interface CustomQuote {
  id: string;
  clientId: string;
  clientName: string;
  requestId?: string;
  lineItems: CustomQuoteLineItem[];
  appliedDiscountIds: string[];
  notes?: string;
  subtotal: number;
  discountTotal: number;
  total: number;
  createdAt: string;
  /** "verified" means an admin has physically confirmed the aircraft/job
   * in person and locked in this number — it's the only status that may
   * be charged via Stripe (see create-checkout-session.ts). */
  status: "draft" | "sent" | "accepted" | "verified";
  verifiedAt?: string;
}

// ---- Estimate wizard types ----

export interface EstimateInput {
  category: AircraftCategory;
  make: string;
  model: string;
  tailNumber?: string;
  condition: AircraftCondition[];
  services: ServiceCode[];
  airport: string;
  fbo?: string;
  hangarNumber?: string;
  rampParked: boolean;
  travelDistanceMiles: number;
  photoCount: number;
}

export interface EstimateResult {
  /** Exact deterministic total before the confidence-variance range is
   * applied — this is what should actually be charged (e.g. via Stripe),
   * since `low`/`high` exist only to set customer expectations. */
  total: number;
  low: number;
  high: number;
  laborHoursLow: number;
  laborHoursHigh: number;
  recommendedPackage: string;
  recommendedAddOns: string[];
  confidence: "high" | "medium" | "low";
  breakdown: PricingLineItem[];
  appliedDiscounts: { label: string; amount: number }[];
}

export interface PricingLineItem {
  label: string;
  amount: number;
  kind: "base" | "multiplier" | "addon" | "fee" | "discount";
}

export const REQUIRED_REPORT_DISCLAIMER =
  "This report is for appearance and cleaning documentation only. It is not an FAA inspection, maintenance release, repair recommendation, or airworthiness determination. Any maintenance-related concerns should be reviewed by a qualified A&P mechanic, IA, or approved maintenance provider.";

export const PRICING_DISCLAIMER =
  "Final pricing depends on aircraft type, size, condition, airport location, access, and requested services.";

export const ESTIMATE_DISCLAIMER =
  "This estimate is based on the information provided and is not a final quotation. Final pricing may change following an on-site inspection.";
