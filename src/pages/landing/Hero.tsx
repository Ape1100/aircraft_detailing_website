import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NNumberPlate } from "@/components/aviation/NNumberPlate";
import { useSettings } from "@/lib/settings-store";

export function Hero() {
  const { businessSettings } = useSettings();

  return (
    <section className="relative overflow-hidden bg-ink pb-24 pt-36">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 80% 0%, rgba(232,163,61,0.18), transparent)",
        }}
      />
      <div className="relative mx-auto grid max-w-6xl gap-12 px-6 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <div>
          <p className="mb-4 font-mono text-xs uppercase tracking-plate text-amber">
            Mobile Aircraft Detailing &amp; Documentation
          </p>
          <h1 className="font-display text-4xl font-semibold leading-[1.05] text-paper text-balance md:text-6xl">
            {businessSettings.tagline}
          </h1>
          <p className="mt-6 max-w-md text-balance text-base text-aluminum md:text-lg">
            Recurring detailing, appearance care, and photo-documented service
            history for private owners, FBOs, flight schools, and charter
            operators — wherever your aircraft is parked.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button asChild variant="amber" size="lg">
              <Link to="/estimate">
                Get an Instant Estimate <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-white/20 text-paper hover:bg-white/10">
              <Link to="/login">Client Login</Link>
            </Button>
          </div>
          <p className="mt-6 max-w-md text-xs leading-relaxed text-aluminum/60">
            Appearance and cleaning services only — not aircraft maintenance,
            inspection, or airworthiness certification.
          </p>
        </div>

        <div className="flex justify-center md:justify-end">
          <div className="flex flex-col items-center gap-5 rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-sm">
            <p className="text-center text-xs uppercase tracking-wide text-aluminum/60">
              Every visit, documented
            </p>
            <NNumberPlate tailNumber="N482WF" size="lg" />
            <div className="grid w-full grid-cols-2 gap-3 text-center">
              <div className="rounded-lg bg-white/5 px-3 py-2">
                <p className="font-mono text-lg font-semibold text-paper">12</p>
                <p className="text-[11px] text-aluminum/60">Services logged</p>
              </div>
              <div className="rounded-lg bg-white/5 px-3 py-2">
                <p className="font-mono text-lg font-semibold text-paper">0</p>
                <p className="text-[11px] text-aluminum/60">Maintenance findings</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
