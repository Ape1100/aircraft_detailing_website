import { useRef, useState, type ChangeEvent } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSettings } from "@/lib/settings-store";

function PhotoUpload({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (dataUrl: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-1.5 flex items-center gap-3">
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
          <ImagePlus className="h-4 w-4" /> Upload
        </Button>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleSelect} />
      </div>
      {value && <img src={value} alt={label} className="mt-2 h-28 w-full rounded-lg object-cover" />}
    </div>
  );
}

export default function AdminGallery() {
  const { gallery, setGalleryEnabled, addGalleryPhoto, updateGalleryPhoto, removeGalleryPhoto } = useSettings();
  const [draft, setDraft] = useState({ label: "", beforeDataUrl: "", afterDataUrl: "" });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Photo Gallery</h1>
        <p className="text-sm text-steel">
          Manage before/after pairs for your public About page. The gallery only appears when enabled and at least one pair exists.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gallery visibility</CardTitle>
          <CardDescription>
            Turn this off if you&apos;re just getting started and don&apos;t have client photos yet — no empty section will show on the site.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={gallery.enabled}
              onChange={(e) => setGalleryEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-ink/20"
            />
            <span className="text-sm text-ink">Show gallery on About page</span>
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add before/after pair</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="gal-label">Label</Label>
            <Input
              id="gal-label"
              value={draft.label}
              onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
              placeholder="Citation CJ3 — full exterior detail"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <PhotoUpload
              label="Before photo"
              value={draft.beforeDataUrl}
              onChange={(v) => setDraft((d) => ({ ...d, beforeDataUrl: v }))}
            />
            <PhotoUpload
              label="After photo"
              value={draft.afterDataUrl}
              onChange={(v) => setDraft((d) => ({ ...d, afterDataUrl: v }))}
            />
          </div>
          <Button
            variant="amber"
            disabled={!draft.label || !draft.beforeDataUrl || !draft.afterDataUrl}
            onClick={() => {
              addGalleryPhoto(draft);
              setDraft({ label: "", beforeDataUrl: "", afterDataUrl: "" });
            }}
          >
            Add to gallery
          </Button>
        </CardContent>
      </Card>

      {gallery.photos.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-display text-lg font-semibold text-ink">Current pairs ({gallery.photos.length})</h2>
          {gallery.photos.map((pair) => (
            <Card key={pair.id}>
              <CardContent className="space-y-4 pt-6">
                <div className="flex items-center justify-between gap-4">
                  <Input
                    value={pair.label}
                    onChange={(e) => updateGalleryPhoto(pair.id, { label: e.target.value })}
                  />
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeGalleryPhoto(pair.id)}>
                    <Trash2 className="h-4 w-4 text-rust" />
                  </Button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <PhotoUpload
                    label="Before"
                    value={pair.beforeDataUrl}
                    onChange={(v) => updateGalleryPhoto(pair.id, { beforeDataUrl: v })}
                  />
                  <PhotoUpload
                    label="After"
                    value={pair.afterDataUrl}
                    onChange={(v) => updateGalleryPhoto(pair.id, { afterDataUrl: v })}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
