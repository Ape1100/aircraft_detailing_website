import type {
  Aircraft,
  ClientProfile,
  DetailingReport,
  Invoice,
  Membership,
  ServiceRequest,
} from "@/types";

export const MOCK_CLIENT: ClientProfile = {
  id: "client-1",
  role: "client",
  name: "Dana Whitfield",
  email: "dana@whitfieldaviation.com",
  phone: "(916) 555-0148",
  company: "Whitfield Aviation LLC",
  completedServiceCount: 4,
};

export const MOCK_AIRCRAFT: Aircraft[] = [
  {
    id: "ac-1",
    ownerId: "client-1",
    tailNumber: "N482WF",
    make: "Cessna",
    model: "172",
    category: "piston_single",
    year: 2014,
    homeAirport: "KSAC — Sacramento Executive",
    hangared: true,
  },
  {
    id: "ac-2",
    ownerId: "client-1",
    tailNumber: "N910CJ",
    make: "Cessna",
    model: "Citation CJ3",
    category: "light_jet",
    year: 2018,
    homeAirport: "KMHR — Sacramento Mather",
    hangared: true,
  },
];

export const MOCK_REQUESTS: ServiceRequest[] = [
  {
    id: "req-1",
    aircraftId: "ac-1",
    clientId: "client-1",
    services: ["exterior_wash", "belly_cleaning"],
    status: "scheduled",
    preferredDate: "2026-06-22",
    airportLocation: "KSAC — Sacramento Executive",
    fboName: "Sacramento Jet Center",
    estimateLow: 470,
    estimateHigh: 540,
    createdAt: "2026-06-10",
  },
  {
    id: "req-2",
    aircraftId: "ac-2",
    clientId: "client-1",
    services: ["complete_detail", "ceramic_coating"],
    status: "quote_sent",
    airportLocation: "KMHR — Sacramento Mather",
    estimateLow: 3100,
    estimateHigh: 3650,
    createdAt: "2026-06-12",
  },
  {
    id: "req-3",
    aircraftId: "ac-1",
    clientId: "client-1",
    services: ["interior_refresh"],
    status: "completed",
    airportLocation: "KSAC — Sacramento Executive",
    estimateLow: 190,
    estimateHigh: 230,
    createdAt: "2026-05-02",
  },
];

export const MOCK_INVOICES: Invoice[] = [
  {
    id: "inv-1",
    clientId: "client-1",
    requestId: "req-3",
    amount: 215,
    status: "paid",
    issuedAt: "2026-05-03",
  },
  {
    id: "inv-2",
    clientId: "client-1",
    requestId: "req-1",
    amount: 505,
    depositAmount: 150,
    status: "deposit_paid",
    issuedAt: "2026-06-11",
    dueAt: "2026-06-22",
  },
];

export const MOCK_MEMBERSHIP: Membership = {
  id: "mem-1",
  clientId: "client-1",
  tier: "owner_care",
  monthlyAmount: 599,
  status: "active",
  startedAt: "2026-01-15",
};

export const MOCK_REPORTS: DetailingReport[] = [
  {
    id: "rep-1",
    aircraftId: "ac-1",
    clientId: "client-1",
    serviceDate: "2026-05-03",
    location: "KSAC — Sacramento Executive",
    servicesPerformed: ["interior_refresh"],
    productsUsed: ["Aircraft-safe interior cleaner", "Microfiber cloths", "UV protectant"],
    technicianNotes: "Cabin in good shape overall. Minor wear on pilot seat bolster.",
    recommendations: "Consider leather conditioning at next visit.",
    observedIssues: [
      {
        id: "iss-1",
        reportId: "rep-1",
        category: "interior_wear",
        note: "Light wear on pilot seat bolster stitching.",
      },
    ],
    photos: [
      { id: "p1", reportId: "rep-1", url: "", kind: "before", caption: "Cabin before" },
      { id: "p2", reportId: "rep-1", url: "", kind: "after", caption: "Cabin after" },
    ],
    disclaimer:
      "This report is for appearance and cleaning documentation only. It is not an FAA inspection, maintenance release, repair recommendation, or airworthiness determination. Any maintenance-related concerns should be reviewed by a qualified A&P mechanic, IA, or approved maintenance provider.",
  },
];

export const MOCK_ADMIN_CLIENTS = [
  { id: "client-1", name: "Dana Whitfield", company: "Whitfield Aviation LLC", aircraftCount: 2, status: "active", completedServiceCount: 4 },
  { id: "client-2", name: "Marcus Reyes", company: "Reyes Charter Co.", aircraftCount: 1, status: "active", completedServiceCount: 1 },
  { id: "client-3", name: "Avery Park", company: "—", aircraftCount: 1, status: "lead", completedServiceCount: 0 },
];
