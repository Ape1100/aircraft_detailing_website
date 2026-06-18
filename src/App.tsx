import { Route, Routes } from "react-router-dom";
import {
  ClipboardList,
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
import EstimateWizard from "@/pages/wizard/EstimateWizard";

import { PortalShell, type PortalNavItem } from "@/components/layout/PortalShell";
import ClientDashboard from "@/pages/client/ClientDashboard";
import MyAircraft from "@/pages/client/MyAircraft";
import ServiceRequests from "@/pages/client/ServiceRequests";
import NewServiceRequest from "@/pages/client/NewServiceRequest";
import Invoices from "@/pages/client/Invoices";
import Reports from "@/pages/client/Reports";
import Membership from "@/pages/client/Membership";

import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminClients from "@/pages/admin/AdminClients";
import AdminRequests from "@/pages/admin/AdminRequests";
import AdminReportBuilder from "@/pages/admin/AdminReportBuilder";
import AdminServices from "@/pages/admin/AdminServices";
import AdminInvoices from "@/pages/admin/AdminInvoices";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminPricingRules from "@/pages/admin/AdminPricingRules";
import AdminDiscounts from "@/pages/admin/AdminDiscounts";
import AdminCustomQuote from "@/pages/admin/AdminCustomQuote";
import AdminGallery from "@/pages/admin/AdminGallery";
import SetupWizard from "@/pages/admin/SetupWizard";

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
  { to: "/admin/custom-quote", label: "Custom Quote", icon: FileSignature },
  { to: "/admin/report-builder", label: "Report Builder", icon: FileText },
  { to: "/admin/services", label: "Services", icon: Wrench },
  { to: "/admin/gallery", label: "Gallery", icon: Images },
  { to: "/admin/pricing-rules", label: "Pricing Rules", icon: SlidersHorizontal },
  { to: "/admin/discounts", label: "Discounts", icon: Tag },
  { to: "/admin/invoices", label: "Invoices", icon: Receipt },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

function ClientLayout() {
  return <PortalShell navItems={CLIENT_NAV} roleLabel="Client Portal" userName="Dana Whitfield" />;
}

function AdminLayout() {
  return <PortalShell navItems={ADMIN_NAV} roleLabel="Admin Portal" userName="Ops Team" />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/about" element={<AboutUs />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/estimate" element={<EstimateWizard />} />
      <Route path="/admin/setup" element={<SetupWizard />} />

      <Route path="/portal" element={<ClientLayout />}>
        <Route path="dashboard" element={<ClientDashboard />} />
        <Route path="aircraft" element={<MyAircraft />} />
        <Route path="requests" element={<ServiceRequests />} />
        <Route path="requests/new" element={<NewServiceRequest />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="reports" element={<Reports />} />
        <Route path="membership" element={<Membership />} />
      </Route>

      <Route path="/admin" element={<AdminLayout />}>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="clients" element={<AdminClients />} />
        <Route path="requests" element={<AdminRequests />} />
        <Route path="custom-quote" element={<AdminCustomQuote />} />
        <Route path="report-builder" element={<AdminReportBuilder />} />
        <Route path="services" element={<AdminServices />} />
        <Route path="gallery" element={<AdminGallery />} />
        <Route path="pricing-rules" element={<AdminPricingRules />} />
        <Route path="discounts" element={<AdminDiscounts />} />
        <Route path="invoices" element={<AdminInvoices />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>
    </Routes>
  );
}
