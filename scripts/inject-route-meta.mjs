// Post-build script: generate per-route HTML files with injected OG/Twitter
// meta tags so non-JS crawlers (social preview bots, iMessage, WhatsApp,
// Slack, Facebook, LinkedIn) see correct per-page titles and descriptions.
//
// WHY NOT EDGE FUNCTIONS: Netlify's CDN serves the SPA index.html from cache
// at a layer that precedes edge function invocation for this static-site setup,
// making edge-function-based injection unreliable. Build-time injection is
// simpler, dependency-free, and definitively correct.
//
// HOW: reads dist/index.html, does the same targeted tag replacements as the
// failed edge function approach, writes dist/{route}/index.html. Netlify's
// file server serves specific files before falling through to /* /index.html.
// The source of truth for content is src/lib/page-meta.ts — this script reads
// it via ../src/lib/page-meta.ts (ESM, already TypeScript-transpiled at this
// point via tsc -b which runs before vite build in package.json build script).
// Since that compiled output isn't directly importable as ESM here, we inline
// the same data — keep this in sync with src/lib/page-meta.ts.

import { readFileSync, mkdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, "../dist");

const SITE_NAME = "Brightwork";
const SITE_URL = "https://brightworkdetailing.com";
const OG_IMAGE =
  "https://images.unsplash.com/photo-1734750358398-917f1da67c1f?auto=format&fit=crop&w=1200&q=80";

// Keep in sync with src/lib/page-meta.ts
const ROUTE_META = {
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
};

function esc(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function injectMeta(html, path, meta) {
  const fullTitle = esc(`${meta.title} | ${SITE_NAME}`);
  const description = esc(meta.description);
  const canonicalUrl = esc(`${SITE_URL}${path}`);
  const image = esc(OG_IMAGE);

  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${fullTitle}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/,         `$1${description}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/,        `$1${fullTitle}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/,  `$1${description}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/,          `$1${canonicalUrl}$2`)
    .replace(/(<meta property="og:image" content=")[^"]*(")/,        `$1${image}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/,       `$1${fullTitle}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(")/,  `$1${description}$2`);
}

const baseHtml = readFileSync(join(DIST, "index.html"), "utf8");

for (const [path, meta] of Object.entries(ROUTE_META)) {
  const injected = injectMeta(baseHtml, path, meta);

  if (path === "/") {
    // Overwrite dist/index.html itself for the homepage.
    writeFileSync(join(DIST, "index.html"), injected);
    console.log("✓ injected meta →  /index.html");
  } else {
    // Write dist/about/index.html, dist/estimate/index.html etc.
    // Netlify serves these files directly before the /* /index.html catch-all.
    const dir = join(DIST, path);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "index.html"), injected);
    console.log(`✓ injected meta →  ${path}/index.html`);
  }
}

console.log("Route meta injection complete.");
