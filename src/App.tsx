import { lazy, Suspense } from "react";
import { Outlet, Route, Routes, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  ClipboardList,
  Compass,
  FileSignature,
  FileText,
  Images,
  LayoutDashboard,
  Plane,
  Receipt,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Tag,
  Users,
  Wrench,
} from "lucide-react";

import LandingPage from "@/pages/LandingPage";
import AboutUs from "@/pages/landing/AboutUs";
import Login from "@/pages/auth/Login";
import Signup from "@/pages/auth/Signup";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ResetPassword from "@/pages/auth/ResetPassword";
import EstimateWizard from "@/pages/wizard/EstimateWizard";
import { RequireAdmin } from "@/components/auth/RequireAdmin";
import { RequireClient } from "@/components/auth/RequireClient";
import { useAuth } from "@/lib/auth-provider";

import { PortalShell, type PortalNavItem } from "@/components/layout/PortalShell";

// Admin/portal pages are lazy-loaded — a homepage visitor should never pay
// for the JS of the entire client/admin portal (report builder + jsPDF,
// pricing rules, etc.) just to see the landing page. Landing/auth pages
// stay eager below since they're real visitor entry points.
const ClientDashboard = lazy(() => import("@/pages/client/ClientDashboard"));
const MyAircraft = lazy(() => import("@/pages/client/MyAircraft"));
const ServiceRequests = lazy(() => import("@/pages/client/ServiceRequests"));
const NewServiceRequest = lazy(() => import("@/pages/client/NewServiceRequest"));
const Invoices = lazy(() => import("@/pages/client/Invoices"));
const Reports = lazy(() => import("@/pages/client/Reports"));
const Membership = lazy(() => import("@/pages/client/Membership"));

const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminClients = lazy(() => import("@/pages/admin/AdminClients"));
const AdminRequests = lazy(() => import("@/pages/admin/AdminRequests"));
const AdminChecklist = lazy(() => import("@/pages/admin/AdminChecklist"));
const AdminCalendar = lazy(() => import("@/pages/admin/AdminCalendar"));
const AdminReportBuilder = lazy(() => import("@/pages/admin/AdminReportBuilder"));
const AdminServices = lazy(() => import("@/pages/admin/AdminServices"));
const AdminInvoices = lazy(() => import("@/pages/admin/AdminInvoices"));
const AdminSettings = lazy(() => import("@/pages/admin/AdminSettings"));
const AdminPricingRules = lazy(() => import("@/pages/admin/AdminPricingRules"));
const AdminDiscounts = lazy(() => import("@/pages/admin/AdminDiscounts"));
const AdminCustomQuote = lazy(() => import("@/pages/admin/AdminCustomQuote"));
const AdminGallery = lazy(() => import("@/pages/admin/AdminGallery"));
const AdminResources = lazy(() => import("@/pages/admin/AdminResources"));
const SetupWizard = lazy(() => import("@/pages/admin/SetupWizard"));

const CLIENT_NAV: PortalNavItem[] = [
  { to: "/portal/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/portal/aircraft", label: "My Aircraft", icon: Plane },
  { to: "/portal/requests", label: "Service Requests", icon: ClipboardList },
  { to: "/portal/invoices", label: "Invoices", icon: Receipt },
  { to: "/portal/reports", label: "Reports", icon: FileText },
  { to: "/portal/membership", label: "Membership", icon: ShieldCheck },
];

const ADMIN_NAV: PortalNavItem[] = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/clients", label: "Clients", icon: Users },
  { to: "/admin/requests", label: "Requests", icon: ClipboardList },
  { to: "/admin/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/admin/custom-quote", label: "Custom Quote", icon: FileSignature },
  { to: "/admin/report-builder", label: "Report Builder", icon: FileText },
  { to: "/admin/services", label: "Services", icon: Wrench },
  { to: "/admin/gallery", label: "Gallery", icon: Images },
  { to: "/admin/resources", label: "Resources", icon: Compass },
  { to: "/admin/pricing-rules", label: "Pricing Rules", icon: SlidersHorizontal },
  { to: "/admin/discounts", label: "Discounts", icon: Tag },
  { to: "/admin/invoices", label: "Invoices", icon: Receipt },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

function ClientLayout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  return (
    <PortalShell
      navItems={CLIENT_NAV}
      roleLabel="Client Portal"
      userName={profile?.name ?? "Client"}
      onLogout={async () => {
        await signOut();
        navigate("/");
      }}
    />
  );
}

function AdminLayout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  return (
    <PortalShell
      navItems={ADMIN_NAV}
      roleLabel="Admin Portal"
      userName={profile?.name ?? "Admin"}
      onLogout={async () => {
        await signOut();
        navigate("/");
      }}
    />
  );
}

function PortalLoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper">
      <div className="flex flex-col items-center gap-3 text-sm text-steel">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink/15 border-t-amber" />
        <span>Loading…</span>
      </div>
    </div>
  );
}

/** Wraps a nested Outlet in Suspense so lazy-loaded page chunks show a
 * fallback without PortalShell's own chrome (sidebar/header) re-mounting —
 * PortalShell renders immediately, only its inner Outlet's content waits. */
function SuspendedOutlet() {
  return (
    <Suspense fallback={<PortalLoadingFallback />}>
      <Outlet />
    </Suspense>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/about" element={<AboutUs />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/estimate" element={<EstimateWizard />} />
      <Route
        path="/admin/setup"
        element={
          <Suspense fallback={<PortalLoadingFallback />}>
            <SetupWizard />
          </Suspense>
        }
      />

      <Route path="/portal" element={<RequireClient />}>
        <Route element={<ClientLayout />}>
          <Route element={<SuspendedOutlet />}>
            <Route path="dashboard" element={<ClientDashboard />} />
            <Route path="aircraft" element={<MyAircraft />} />
            <Route path="requests" element={<ServiceRequests />} />
            <Route path="requests/new" element={<NewServiceRequest />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="reports" element={<Reports />} />
            <Route path="membership" element={<Membership />} />
          </Route>
        </Route>
      </Route>

      <Route path="/admin" element={<RequireAdmin />}>
        <Route element={<AdminLayout />}>
          <Route element={<SuspendedOutlet />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="clients" element={<AdminClients />} />
            <Route path="requests" element={<AdminRequests />} />
            <Route path="requests/:requestId/checklist" element={<AdminChecklist />} />
            <Route path="calendar" element={<AdminCalendar />} />
            <Route path="custom-quote" element={<AdminCustomQuote />} />
            <Route path="report-builder" element={<AdminReportBuilder />} />
            <Route path="services" element={<AdminServices />} />
            <Route path="gallery" element={<AdminGallery />} />
            <Route path="resources" element={<AdminResources />} />
            <Route path="pricing-rules" element={<AdminPricingRules />} />
            <Route path="discounts" element={<AdminDiscounts />} />
            <Route path="invoices" element={<AdminInvoices />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
