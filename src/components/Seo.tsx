import { Helmet } from "react-helmet-async";

const SITE_NAME = "Brightwork";
const SITE_URL = "https://brightworkdetailing.com";
// The Gulfstream hero already preloaded in index.html — 1200 px wide,
// standard OG width. No new asset needed.
const DEFAULT_OG_IMAGE = `https://images.unsplash.com/photo-1734750358398-917f1da67c1f?auto=format&fit=crop&w=1200&q=80`;

interface SeoProps {
  title: string;
  description: string;
  /** Canonical path, e.g. "/" or "/about" — prepended with SITE_URL. */
  path: string;
  /** Override the default hero image for this page's OG card. */
  ogImage?: string;
}

/** Drop one of these inside any page component to set its own title,
 * description, and Open Graph tags. react-helmet-async deduplicates
 * <title> and <meta> correctly across client-side route transitions. */
export function Seo({ title, description, path, ogImage }: SeoProps) {
  const fullTitle = `${title} | ${SITE_NAME}`;
  const canonicalUrl = `${SITE_URL}${path}`;
  const image = ogImage ?? DEFAULT_OG_IMAGE;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph — controls preview cards in iMessage, Slack, etc. */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      {/* Twitter/X card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
}
