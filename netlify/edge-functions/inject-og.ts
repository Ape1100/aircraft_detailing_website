// Netlify Edge Function: inject-og
// -----------------------------------------------------------------------
// Runs at the CDN edge before any HTML reaches the requester. Replaces
// the generic/fallback OG and Twitter meta tags in dist/index.html with
// route-specific values based on the request path.
//
// WHY: react-helmet-async sets per-page tags after JS loads (fine for
// Googlebot, which executes JS), but social link-preview bots — iMessage,
// WhatsApp, Slack, Facebook, LinkedIn — fetch raw HTML only and saw
// identical homepage tags for every shared URL. This fixes that.
//
// SELF-CONTAINED: route metadata is inlined here rather than imported
// from src/lib/page-meta.ts. Cross-directory imports can be unreliable
// in Netlify's Deno edge bundler. Keep the copy here in sync with
// src/lib/page-meta.ts if titles/descriptions change.
// -----------------------------------------------------------------------

import type { Context } from "https://edge.netlify.com";

const SITE_NAME = "Brightwork";
const SITE_URL = "https://brightworkdetailing.com";
const OG_IMAGE =
  "https://images.unsplash.com/photo-1734750358398-917f1da67c1f?auto=format&fit=crop&w=1200&q=80";

const ROUTE_META: Record<string, { title: string; description: string }> = {
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
};

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export default async function handler(req: Request, context: Context) {
  // Pass non-HTML requests straight through.
  const accept = req.headers.get("accept") ?? "";
  if (!accept.includes("text/html")) {
    return context.next();
  }

  const response = await context.next();
  const ct = response.headers.get("content-type") ?? "";
  if (!ct.includes("text/html")) {
    return response;
  }

  const url = new URL(req.url);
  const path = url.pathname;
  const meta = ROUTE_META[path] ?? ROUTE_META["/"];
  const fullTitle = esc(`${meta.title} | ${SITE_NAME}`);
  const description = esc(meta.description);
  const canonicalUrl = esc(`${SITE_URL}${path}`);
  const image = esc(OG_IMAGE);

  let html = await response.text();

  html = html
    .replace(/<title>[^<]*<\/title>/, `<title>${fullTitle}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/,  `$1${description}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/,  `$1${fullTitle}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/,  `$1${description}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/,  `$1${canonicalUrl}$2`)
    .replace(/(<meta property="og:image" content=")[^"]*(")/,  `$1${image}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/,  `$1${fullTitle}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(")/,  `$1${description}$2`);

  const headers = new Headers(response.headers);
  headers.set("cache-control", "no-cache");

  return new Response(html, { status: response.status, headers });
}
