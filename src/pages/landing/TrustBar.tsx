import { useSettings } from "@/lib/settings-store";

const AUDIENCE = ["Private Owners", "FBOs", "Flight Schools", "Charter Operators", "Fleet Managers"];

export function TrustBar() {
  const { businessSettings } = useSettings();
  return (
    <section className="border-b border-ink/10 bg-white py-10">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-center text-xs uppercase tracking-wide text-steel2">
          Trusted by
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
          {AUDIENCE.map((a) => (
            <span key={a} className="font-display text-sm font-medium text-steel">
              {a}
            </span>
          ))}
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-sm text-steel">
          Appearance preservation, photo documentation, and recurring care —
          delivered on your ramp or in your hangar. {businessSettings.companyName} is not a
          maintenance provider and does not perform inspections, repairs, or
          airworthiness determinations.
        </p>
      </div>
    </section>
  );
}
