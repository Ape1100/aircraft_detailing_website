import { ExternalLink } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useSettings } from "@/lib/settings-store";
import { AFFILIATE_DISCLOSURE, type ResourceLink } from "@/types";

export function ResourceHub() {
  const { resourceHub } = useSettings();
  const posthog = usePostHog();

  const activeLinks = resourceHub.links.filter((l) => l.active);
  if (!resourceHub.enabled || activeLinks.length === 0) return null;

  const forumLinks = activeLinks.filter((l) => l.category === "forum");
  const affiliateLinks = activeLinks.filter((l) => l.category === "affiliate");

  function handleLinkClick(link: ResourceLink) {
    posthog?.capture("resource_link_clicked", {
      title: link.title,
      url: link.url,
      category: link.category,
    });
  }

  return (
    <section className="border-b border-ink/10 bg-white px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-xl">
          <p className="font-mono text-xs uppercase tracking-plate text-amberDark">Resource Hub</p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-ink md:text-4xl">
            Owner communities &amp; tools we recommend
          </h2>
          <p className="mt-3 text-steel">
            A few places we point fellow aircraft owners for maintenance advice, type-specific
            know-how, and gear worth having on hand.
          </p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
          {forumLinks.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {forumLinks.map((link) => (
                <ResourceLinkCard key={link.id} link={link} onClick={() => handleLinkClick(link)} />
              ))}
            </div>
          )}

          {affiliateLinks.length > 0 && (
            <aside className="lg:border-l lg:border-ink/10 lg:pl-8">
              <p className="text-xs text-steel2">{AFFILIATE_DISCLOSURE}</p>
              <div className="mt-4 space-y-4">
                {affiliateLinks.map((link) => (
                  <ResourceLinkCard key={link.id} link={link} onClick={() => handleLinkClick(link)} compact />
                ))}
              </div>
            </aside>
          )}
        </div>
      </div>
    </section>
  );
}

function ResourceLinkCard({
  link,
  onClick,
  compact,
}: {
  link: ResourceLink;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <Card>
      <CardHeader className={compact ? "pb-2" : undefined}>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className={compact ? "text-base" : undefined}>{link.title}</CardTitle>
          <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-steel2" />
        </div>
        <CardDescription>{link.description}</CardDescription>
      </CardHeader>
      <CardContent className={compact ? "pt-0" : undefined}>
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClick}
          className="text-sm font-medium text-amberDark hover:underline"
        >
          Visit site →
        </a>
      </CardContent>
    </Card>
  );
}
