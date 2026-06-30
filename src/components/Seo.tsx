import { Helmet } from "react-helmet-async";
import { buildFullTitle, DEFAULT_OG_IMAGE, ROUTE_META, SITE_NAME, SITE_URL } from "@/lib/page-meta";

interface SeoProps {
  /** Canonical path, e.g. "/" or "/about". Looks up ROUTE_META for
   * title/description — the edge function (inject-og.ts) uses the same
   * data, so in-browser and social-preview content stay in sync. */
  path: string;
  /** Override the default hero image for this page's OG card. */
  ogImage?: string;
}

export function Seo({ path, ogImage }: SeoProps) {
  const meta = ROUTE_META[path] ?? ROUTE_META["/"];
  const fullTitle = buildFullTitle(meta);
  const canonicalUrl = `${SITE_URL}${path}`;
  const image = ogImage ?? DEFAULT_OG_IMAGE;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={meta.description} />
      <link rel="canonical" href={canonicalUrl} />

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={meta.description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
}
