import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSettings } from "@/lib/settings-store";
import type { ResourceLink, ResourceLinkCategory } from "@/types";

const CATEGORY_LABEL: Record<ResourceLinkCategory, string> = {
  forum: "Forum / Type Club",
  affiliate: "Affiliate Product",
};

const EMPTY_DRAFT = {
  title: "",
  url: "",
  description: "",
  category: "forum" as ResourceLinkCategory,
  isLiveAffiliateLink: false,
};

export default function AdminResources() {
  const { resourceHub, setResourceHubEnabled, addResourceLink, updateResourceLink, removeResourceLink } =
    useSettings();
  const [draft, setDraft] = useState(EMPTY_DRAFT);

  const forumLinks = resourceHub.links.filter((l) => l.category === "forum");
  const affiliateLinks = resourceHub.links.filter((l) => l.category === "affiliate");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Resource Hub</h1>
        <p className="text-sm text-steel">
          Links shown in the homepage sidebar to build trust with visitors — owner forums, type
          clubs, and a couple of verified affiliate programs.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resource hub visibility</CardTitle>
          <CardDescription>Turn this off to hide the section from the homepage entirely.</CardDescription>
        </CardHeader>
        <CardContent>
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={resourceHub.enabled}
              onChange={(e) => setResourceHubEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-ink/20"
            />
            <span className="text-sm text-ink">Show resource hub on homepage</span>
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Affiliate disclosure</CardTitle>
          <CardDescription>
            Affiliate links require a visible disclosure per FTC guidelines. That disclosure is
            shown automatically on the homepage next to affiliate links and can&apos;t be turned
            off or edited here.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add a link</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="res-title">Title</Label>
            <Input
              id="res-title"
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              placeholder="Pilots of America"
            />
          </div>
          <div>
            <Label htmlFor="res-url">URL</Label>
            <Input
              id="res-url"
              type="url"
              value={draft.url}
              onChange={(e) => setDraft((d) => ({ ...d, url: e.target.value }))}
              placeholder="https://www.pilotsofamerica.com/community/"
            />
          </div>
          <div>
            <Label htmlFor="res-description">Description</Label>
            <Input
              id="res-description"
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              placeholder="General GA pilot and owner discussion forum."
            />
          </div>
          <div>
            <Label htmlFor="res-category">Category</Label>
            <Select
              value={draft.category}
              onValueChange={(v) => setDraft((d) => ({ ...d, category: v as ResourceLinkCategory }))}
            >
              <SelectTrigger id="res-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(CATEGORY_LABEL) as ResourceLinkCategory[]).map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {CATEGORY_LABEL[cat]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {draft.category === "affiliate" && (
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={draft.isLiveAffiliateLink}
                onChange={(e) => setDraft((d) => ({ ...d, isLiveAffiliateLink: e.target.checked }))}
                className="h-4 w-4 rounded border-ink/20"
              />
              <span className="text-sm text-ink">This is my live, personal tracking link (not a placeholder)</span>
            </label>
          )}
          <Button
            variant="amber"
            disabled={!draft.title || !draft.url || !draft.description}
            onClick={() => {
              addResourceLink({ ...draft, active: true });
              setDraft(EMPTY_DRAFT);
            }}
          >
            <Plus className="h-4 w-4" /> Add link
          </Button>
        </CardContent>
      </Card>

      <ResourceLinkList
        title="Forums & Communities"
        links={forumLinks}
        onUpdate={updateResourceLink}
        onRemove={removeResourceLink}
      />
      <ResourceLinkList
        title="Affiliate Products"
        links={affiliateLinks}
        onUpdate={updateResourceLink}
        onRemove={removeResourceLink}
      />
    </div>
  );
}

function ResourceLinkList({
  title,
  links,
  onUpdate,
  onRemove,
}: {
  title: string;
  links: ResourceLink[];
  onUpdate: (id: string, patch: Partial<ResourceLink>) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-lg font-semibold text-ink">
        {title} ({links.length})
      </h2>
      {links.length === 0 && <p className="text-sm text-steel">No resource links yet.</p>}
      {links.map((link) => (
        <Card key={link.id}>
          <CardContent className="space-y-3 pt-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-1 flex-wrap items-center gap-2">
                <Input
                  value={link.title}
                  onChange={(e) => onUpdate(link.id, { title: e.target.value })}
                  className="max-w-xs"
                />
                {link.category === "affiliate" && (
                  <Badge variant={link.isLiveAffiliateLink ? "green" : "rust"}>
                    {link.isLiveAffiliateLink ? "Live tracking link" : "Placeholder link"}
                  </Badge>
                )}
                <Badge variant={link.active ? "green" : "neutral"}>{link.active ? "Active" : "Inactive"}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => onUpdate(link.id, { active: !link.active })}>
                  {link.active ? "Deactivate" : "Activate"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (window.confirm(`Remove "${link.title}"?`)) onRemove(link.id);
                  }}
                  aria-label="Delete resource link"
                >
                  <Trash2 className="h-4 w-4 text-rust" />
                </Button>
              </div>
            </div>
            <Input value={link.url} onChange={(e) => onUpdate(link.id, { url: e.target.value })} />
            <Input value={link.description} onChange={(e) => onUpdate(link.id, { description: e.target.value })} />
            {link.category === "affiliate" && (
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={link.isLiveAffiliateLink ?? false}
                  onChange={(e) => onUpdate(link.id, { isLiveAffiliateLink: e.target.checked })}
                  className="h-4 w-4 rounded border-ink/20"
                />
                <span className="text-sm text-ink">Live, personal tracking link</span>
              </label>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
