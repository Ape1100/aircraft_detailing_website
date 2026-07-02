// Single source of truth for per-route SEO metadata.
//
// Used by TWO consumers — keep this file free of React, Node, and
// browser APIs so both can import it cleanly:
//   1. src/components/Seo.tsx (React, client-side)
//   2. netlify/edge-functions/inject-og.ts (Deno edge runtime)
//
// Limitation: the /about page uses businessSettings.companyName
// dynamically in the browser (via Zustand). That dynamic value is not
// accessible at the edge, so the entry below uses the default "Brightwork".
// In-browser rendering via <Seo> still picks up the admin-configured name.

export const SITE_NAME = "Brightwork";
export const SITE_URL = "https://brightworkdetailing.com";
export const DEFAULT_OG_IMAGE =
  "https://images.unsplash.com/photo-1734750358398-917f1da67c1f?auto=format&fit=crop&w=1200&q=80";

export interface RouteMeta {
  /** Short title, combined with SITE_NAME for the <title> tag. */
  title: string;
  description: string;
}

/** Keyed by exact pathname, e.g. "/", "/about". The edge function falls
 * back to the "/" entry for any unmatched path. */
export const ROUTE_META: Record<string, RouteMeta> = {
  "/": {
    title: "Aircraft Appearance & Preservation Services",
    description:
      "Mobile aircraft detailing, appearance preservation, and photo-documented service for owners, FBOs, charter operators, and flight schools. CA Central Valley & Bay Area.",
  },
  "/about": {
    title: "About Brightwork",
    description:
      "Learn about Brightwork — mobile aircraft detailing and appearance preservation services for owners, FBOs, and operators. Mobile service — CA Central Valley & Bay Area.",
  },
  "/estimate": {
    title: "Get an Instant Aircraft Detailing Estimate",
    description:
      "Tell us about your aircraft and we'll give you an instant price estimate for exterior wash, interior refresh, paint correction, ceramic coating, and more.",
  },
  "/login": {
    title: "Sign In — Client & Admin Portal",
    description:
      "Sign in to the Brightwork client portal to track service requests, view invoices, and manage your aircraft profiles.",
  },
  "/signup": {
    title: "Create a Client Account",
    description:
      "Create your Brightwork client account to track aircraft detailing service requests, view reports, and manage invoices online.",
  },
  "/forgot-password": {
    title: "Reset Your Password",
    description: "Request a password reset link for your Brightwork client or admin account.",
  },
  "/reset-password": {
    title: "Set a New Password",
    description: "Choose a new password for your Brightwork client or admin account.",
  },
};

export function buildFullTitle(meta: RouteMeta): string {
  return `${meta.title} | ${SITE_NAME}`;
}
