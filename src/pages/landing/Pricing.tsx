import { Separator } from "@/components/ui/separator";
import { PRICING_DISCLAIMER } from "@/types";
import { useSettings } from "@/lib/settings-store";
import { formatCurrency } from "@/lib/utils";

export function Pricing() {
  const { services } = useSettings();
  const oneTime = services.filter((s) => s.category === "launch");

  return (
    <section id="pricing" className="bg-ink px-6 py-24">
      <div className="mx-auto max-w-3xl">
        <p className="text-center font-mono text-xs uppercase tracking-plate text-amber">
          Rate Card
        </p>
        <h2 className="mt-2 text-center font-display text-3xl font-semibold text-paper md:text-4xl">
          One-time services
        </h2>

        <div className="mt-10 divide-y divide-white/10 rounded-xl border border-white/10 bg-white/[0.03]">
          {oneTime.map((item) => (
            <div key={item.code} className="flex items-center justify-between px-6 py-4">
              <span className="font-display text-base text-paper">{item.name}</span>
              <span className="font-mono text-sm text-aluminum">
                {item.startingPrice ? `Starting at ${formatCurrency(item.startingPrice)}` : "Quote required"}
              </span>
            </div>
          ))}
        </div>

        <Separator className="my-8 bg-white/10" />

        <p className="text-center text-sm text-aluminum/70">{PRICING_DISCLAIMER}</p>
      </div>
    </section>
  );
}
