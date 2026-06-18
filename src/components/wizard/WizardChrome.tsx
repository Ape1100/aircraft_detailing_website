import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function StepShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-2">
      <h1 className="font-display text-2xl font-semibold text-ink md:text-3xl">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-steel">{subtitle}</p>}
      <div className="mt-6">{children}</div>
    </div>
  );
}

export function OptionCard({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-16 items-center justify-center rounded-lg border px-3 text-center text-sm font-medium transition-colors",
        selected ? "border-amber bg-amber/10 text-amberDark" : "border-ink/15 bg-white text-ink hover:border-ink/30"
      )}
    >
      {children}
    </button>
  );
}
