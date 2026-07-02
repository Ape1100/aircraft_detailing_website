import type { ReactNode } from "react";
import { getResponsiveSampleBackgroundUrls } from "@/lib/sample-backgrounds";
import type { BackgroundSettings } from "@/types";
import { cn } from "@/lib/utils";

interface BrandBackdropProps {
  background: BackgroundSettings;
  children: ReactNode;
  className?: string;
  overlayClassName?: string;
  imageClassName?: string;
  /** CSS background-position, e.g. "65% center" to frame the aircraft on the right. */
  imagePosition?: string;
}

export function BrandBackdrop({
  background,
  children,
  className,
  overlayClassName,
  imageClassName,
  imagePosition = "center center",
}: BrandBackdropProps) {
  const responsiveUrls = background.mode === "sample" ? getResponsiveSampleBackgroundUrls(background.sampleId) : null;
  const customUrl = background.mode === "custom" ? background.customDataUrl : null;
  const hasImage = Boolean(responsiveUrls || customUrl);

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={background.mode === "solid" ? { backgroundColor: background.solidColorHex } : undefined}
    >
      {hasImage && (
        <>
          {responsiveUrls ? (
            <>
              {/* Mobile gets a smaller download of the same photo instead of
               * the full desktop-width image — browsers don't fetch
               * background-image on elements that never render. */}
              <div
                className={cn(
                  "pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat md:hidden",
                  imageClassName
                )}
                style={{
                  backgroundImage: `url(${responsiveUrls.mobile})`,
                  backgroundPosition: imagePosition,
                }}
                role="presentation"
              />
              <div
                className={cn(
                  "pointer-events-none absolute inset-0 hidden bg-cover bg-center bg-no-repeat md:block",
                  imageClassName
                )}
                style={{
                  backgroundImage: `url(${responsiveUrls.desktop})`,
                  backgroundPosition: imagePosition,
                }}
                role="presentation"
              />
            </>
          ) : (
            <div
              className={cn(
                "pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat",
                imageClassName
              )}
              style={{
                backgroundImage: `url(${customUrl})`,
                backgroundPosition: imagePosition,
              }}
              role="presentation"
            />
          )}
          <div className={cn("pointer-events-none absolute inset-0 bg-ink/70", overlayClassName)} />
        </>
      )}
      {!hasImage && background.mode === "solid" && (
        <div className={cn("pointer-events-none absolute inset-0 bg-ink/20", overlayClassName)} />
      )}
      <div className="relative">{children}</div>
    </div>
  );
}
