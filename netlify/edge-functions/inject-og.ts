// Netlify Edge Function: inject-og
// Injects route-specific OG/Twitter meta tags before the response
// reaches social preview bots that don't execute JavaScript.

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

// Inline the Context interface rather than importing it — avoids the
// import URL/package compatibility issues that caused the previous two
// deployment failures. The only method we need is next().
interface EdgeContext {
  next: (options?: { sendConditionalRequest?: boolean }) => Promise<Response>;
}

export default async function handler(
  request: Request,
  context: EdgeContext
): Promise<Response> {
  // Pass non-HTML requests (JS, CSS, images, API) straight through.
  const accept = request.headers.get("accept") ?? "";
  if (!accept.includes("text/html")) {
    return context.next();
  }

  const response = await context.next();

  const ct = response.headers.get("content-type") ?? "";
  if (!ct.includes("text/html")) {
    return response;
  }

  const url = new URL(request.url);
  const path = url.pathname;
  const meta = ROUTE_META[path] ?? ROUTE_META["/"];
  const fullTitle = esc(`${meta.title} | ${SITE_NAME}`);
  const description = esc(meta.description);
  const canonicalUrl = esc(`${SITE_URL}${path}`);
  const image = esc(OG_IMAGE);

  let html = await response.text();

  html = html
    .replace(/<title>[^<]*<\/title>/, `<title>${fullTitle}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/,          `$1${description}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/,         `$1${fullTitle}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/,   `$1${description}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/,           `$1${canonicalUrl}$2`)
    .replace(/(<meta property="og:image" content=")[^"]*(")/,         `$1${image}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/,        `$1${fullTitle}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(")/,  `$1${description}$2`);

  const headers = new Headers(response.headers);
  headers.set("cache-control", "no-cache");

  return new Response(html, { status: response.status, headers });
}

export const config = { path: "/*" };
