import type { ReactNode } from "react";
import { getSampleBackgroundUrl } from "@/lib/sample-backgrounds";
import type { BackgroundSettings } from "@/types";
import { cn } from "@/lib/utils";

interface BrandBackdropProps {
  background: BackgroundSettings;
  children: ReactNode;
  className?: string;
  overlayClassName?: string;
}

export function BrandBackdrop({ background, children, className, overlayClassName }: BrandBackdropProps) {
  const sampleUrl = background.mode === "sample" ? getSampleBackgroundUrl(background.sampleId) : null;
  const imageUrl = background.mode === "custom" ? background.customDataUrl : sampleUrl;

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={background.mode === "solid" ? { backgroundColor: background.solidColorHex } : undefined}
    >
      {imageUrl && (
        <>
          <div
            className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${imageUrl})` }}
          />
          <div className={cn("pointer-events-none absolute inset-0 bg-ink/70", overlayClassName)} />
        </>
      )}
      {!imageUrl && background.mode === "solid" && (
        <div className={cn("pointer-events-none absolute inset-0 bg-ink/20", overlayClassName)} />
      )}
      <div className="relative">{children}</div>
    </div>
  );
}
