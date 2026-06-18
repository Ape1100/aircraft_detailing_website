import { useSettings } from "@/lib/settings-store";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  /** Use light text for dark backgrounds (header/footer on the ink hero). */
  light?: boolean;
}

/** Renders the tenant's logo if one has been uploaded in Admin > Settings,
 * otherwise falls back to a text wordmark using their company name and
 * accent color — works for any business name, not just "Brightwork". */
export function BrandLogo({ className, light }: BrandLogoProps) {
  const { businessSettings } = useSettings();

  if (businessSettings.logoDataUrl) {
    return (
      <img
        src={businessSettings.logoDataUrl}
        alt={businessSettings.companyName}
        className={cn("h-8 w-auto object-contain", className)}
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-display text-base font-semibold tracking-wide",
        light ? "text-paper" : "text-ink",
        className
      )}
    >
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={{ backgroundColor: businessSettings.accentColorHex }}
        aria-hidden
      />
      {businessSettings.companyName.toUpperCase()}
    </span>
  );
}
