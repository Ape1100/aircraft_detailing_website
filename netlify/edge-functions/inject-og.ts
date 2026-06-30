// Netlify Edge Function: inject-og
// -----------------------------------------------------------------------
// Runs at the CDN edge before any HTML reaches the requester. Replaces
// the generic/fallback OG and Twitter meta tags baked into dist/index.html
// with route-specific values from src/lib/page-meta.ts.
//
// WHY: react-helmet-async sets per-page tags client-side after JS loads,
// which Googlebot sees (it executes JS), but social link-preview bots
// (iMessage, WhatsApp, Slack, Facebook, LinkedIn) fetch only the raw HTML
// and never execute JS — they saw identical homepage tags for every URL.
// This function fixes that without adding SSR or SSG to the project.
//
// HOW: intercepts HTML responses only (JS/CSS/API/assets pass straight
// through). Reads the path, looks up the matching RouteMeta from the
// same shared module the <Seo> component uses, and does a targeted
// regex-replace of the existing static tags already in index.html.
// -----------------------------------------------------------------------

import type { Context } from "@netlify/edge-functions";
import {
  buildFullTitle,
  DEFAULT_OG_IMAGE,
  ROUTE_META,
  SITE_URL,
} from "../../src/lib/page-meta.ts";

/** Escape characters that would break an HTML attribute value. */
function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export default async function handler(req: Request, context: Context) {
  // Pass non-HTML requests (JS bundles, CSS, images, API calls) straight
  // through — no need to read or modify them.
  const accept = req.headers.get("accept") ?? "";
  if (!accept.includes("text/html")) {
    return context.next();
  }

  const response = await context.next();

  // Only modify actual HTML responses.
  const ct = response.headers.get("content-type") ?? "";
  if (!ct.includes("text/html")) {
    return response;
  }

  const url = new URL(req.url);
  const path = url.pathname;

  // Fall back to "/" meta for any path not explicitly listed — e.g.
  // /portal, /admin — which we don't expect to be crawled anyway.
  const meta = ROUTE_META[path] ?? ROUTE_META["/"];
  const fullTitle = esc(buildFullTitle(meta));
  const description = esc(meta.description);
  const canonicalUrl = esc(`${SITE_URL}${path}`);
  const image = esc(DEFAULT_OG_IMAGE);

  let html = await response.text();

  // Replace the static fallback values already present in dist/index.html.
  // Using targeted replacements rather than DOM manipulation keeps the
  // function tiny and the Deno runtime dependency-free.
  html = html
    .replace(/<title>[^<]*<\/title>/, `<title>${fullTitle}</title>`)
    .replace(
      /(<meta name="description" content=")[^"]*(")/,
      `$1${description}$2`
    )
    .replace(
      /(<meta property="og:title" content=")[^"]*(")/,
      `$1${fullTitle}$2`
    )
    .replace(
      /(<meta property="og:description" content=")[^"]*(")/,
      `$1${description}$2`
    )
    .replace(
      /(<meta property="og:url" content=")[^"]*(")/,
      `$1${canonicalUrl}$2`
    )
    .replace(
      /(<meta property="og:image" content=")[^"]*(")/,
      `$1${image}$2`
    )
    .replace(
      /(<meta name="twitter:title" content=")[^"]*(")/,
      `$1${fullTitle}$2`
    )
    .replace(
      /(<meta name="twitter:description" content=")[^"]*(")/,
      `$1${description}$2`
    );

  // Preserve original headers (cache-control, etag, etc.) and status.
  const headers = new Headers(response.headers);
  // Avoid caching stale tags at the CDN level for the injected HTML.
  headers.set("cache-control", "no-cache");

  return new Response(html, { status: response.status, headers });
}
