import { X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const STORAGE_KEY = "promo-july4-2026-dismissed";

export function PromoBanner() {
  const [dismissed, setDismissed] = useState(
    () => typeof window !== "undefined" && !!localStorage.getItem(STORAGE_KEY)
  );

  if (dismissed) return null;

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setDismissed(true);
  }

  return (
    <div className="relative z-50 bg-ink border-b border-amber/40">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2.5">
        <div className="flex flex-1 items-center justify-center gap-3 text-center">
          <span className="font-mono text-xs font-semibold uppercase tracking-widest text-amber">
            4th of July — 15% off all services
          </span>
          <span className="hidden text-ink/40 sm:inline">·</span>
          <span className="hidden text-xs text-steel sm:inline">
            Book by July 6, 2026
          </span>
          <Link
            to="/estimate"
            className="ml-1 rounded border border-amber/60 bg-amber/10 px-3 py-0.5 font-mono text-xs font-semibold uppercase tracking-wide text-amber transition hover:bg-amber/20"
          >
            Get Estimate →
          </Link>
        </div>
        <button
          onClick={dismiss}
          aria-label="Dismiss promotion"
          className="flex-shrink-0 text-steel hover:text-paper transition"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
