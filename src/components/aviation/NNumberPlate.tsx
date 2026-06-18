import { cn } from "@/lib/utils";

interface NNumberPlateProps {
  tailNumber?: string;
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/** Styled like the metal registration data plate mounted near an aircraft's
 * entrance — the recurring signature motif used for tail numbers throughout
 * the app (hero, quote form, wizard, aircraft cards). */
export function NNumberPlate({
  tailNumber,
  label = "REGISTERED AIRCRAFT",
  size = "md",
  className,
}: NNumberPlateProps) {
  const sizes = {
    sm: "px-3 py-2 text-base",
    md: "px-4 py-3 text-xl",
    lg: "px-6 py-4 text-3xl",
  };
  return (
    <div
      className={cn(
        "relative inline-flex flex-col items-start rounded-md border border-aluminum/40 bg-ink2 bg-brushed shadow-plate",
        sizes[size],
        className
      )}
    >
      <span className="font-mono text-[9px] tracking-plate text-aluminum/70">{label}</span>
      <span className="font-mono font-semibold tracking-plate text-paper">
        {tailNumber || "N\u2014\u2014\u2014\u2014"}
      </span>
      <span className="absolute left-1.5 top-1.5 h-1 w-1 rounded-full bg-aluminum/30" />
      <span className="absolute right-1.5 top-1.5 h-1 w-1 rounded-full bg-aluminum/30" />
      <span className="absolute bottom-1.5 left-1.5 h-1 w-1 rounded-full bg-aluminum/30" />
      <span className="absolute bottom-1.5 right-1.5 h-1 w-1 rounded-full bg-aluminum/30" />
    </div>
  );
}
