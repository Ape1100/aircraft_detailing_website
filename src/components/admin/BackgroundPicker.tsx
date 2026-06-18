import { useRef, type ChangeEvent } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SAMPLE_BACKGROUNDS } from "@/lib/sample-backgrounds";
import type { BackgroundSettings } from "@/types";
import { cn } from "@/lib/utils";

interface BackgroundPickerProps {
  value: BackgroundSettings;
  onChange: (patch: Partial<BackgroundSettings>) => void;
}

export function BackgroundPicker({ value, onChange }: BackgroundPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleCustomUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onChange({ mode: "custom", customDataUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {(["solid", "sample", "custom"] as const).map((mode) => (
          <Button
            key={mode}
            type="button"
            size="sm"
            variant={value.mode === mode ? "default" : "outline"}
            onClick={() => onChange({ mode })}
          >
            {mode === "solid" ? "Solid color" : mode === "sample" ? "Sample photos" : "Upload your own"}
          </Button>
        ))}
      </div>

      {value.mode === "solid" && (
        <div>
          <Label htmlFor="bg-solid">Background color</Label>
          <div className="mt-1.5 flex items-center gap-2">
            <input
              id="bg-solid"
              type="color"
              value={value.solidColorHex}
              onChange={(e) => onChange({ solidColorHex: e.target.value })}
              className="h-11 w-14 cursor-pointer rounded-lg border border-ink/15"
            />
            <Input
              value={value.solidColorHex}
              onChange={(e) => onChange({ solidColorHex: e.target.value })}
              className="font-mono"
            />
          </div>
        </div>
      )}

      {value.mode === "sample" && (
        <div className="grid gap-3 sm:grid-cols-2">
          {SAMPLE_BACKGROUNDS.map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => onChange({ sampleId: sample.id, mode: "sample" })}
              className={cn(
                "overflow-hidden rounded-lg border text-left transition-colors",
                value.sampleId === sample.id ? "border-amber ring-2 ring-amber/30" : "border-ink/15 hover:border-ink/30"
              )}
            >
              <img src={sample.url} alt={sample.label} className="h-24 w-full object-cover" />
              <p className="px-3 py-2 text-sm font-medium text-ink">{sample.label}</p>
            </button>
          ))}
        </div>
      )}

      {value.mode === "custom" && (
        <div>
          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <ImagePlus className="h-4 w-4" /> Upload image
            </Button>
            {value.customDataUrl && (
              <Button type="button" variant="ghost" size="sm" onClick={() => onChange({ customDataUrl: null })}>
                <Trash2 className="h-4 w-4 text-rust" /> Remove
              </Button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleCustomUpload} />
          </div>
          {value.customDataUrl && (
            <img src={value.customDataUrl} alt="Custom background" className="mt-3 h-32 w-full rounded-lg object-cover" />
          )}
        </div>
      )}
    </div>
  );
}
