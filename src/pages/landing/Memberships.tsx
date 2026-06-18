import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const PLANS = [
  {
    name: "Ramp Ready",
    price: "$299",
    cadence: "/month",
    description: "Recurring exterior care to keep an actively flown aircraft presentable.",
    features: ["Monthly exterior wash", "Bug & exhaust residue removal", "Service history log"],
  },
  {
    name: "Owner Care",
    price: "$599",
    cadence: "/month",
    description: "Our most popular plan for owners who want consistent appearance upkeep.",
    features: ["Everything in Ramp Ready", "Monthly interior refresh", "Quarterly belly cleaning", "Priority scheduling"],
    featured: true,
  },
  {
    name: "Preservation",
    price: "$1,200",
    cadence: "/month",
    description: "Comprehensive appearance preservation for higher-use or higher-value aircraft.",
    features: ["Everything in Owner Care", "Brightwork polishing", "Detailed photo documentation", "Pre-trip readiness checks"],
  },
  {
    name: "Fleet / FBO",
    price: "Custom",
    cadence: "quote",
    description: "Recurring preservation across a managed fleet or FBO ramp.",
    features: ["Multi-aircraft scheduling", "Consolidated invoicing", "Dedicated account contact"],
  },
];

export function Memberships() {
  return (
    <section id="membership" className="bg-paper px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-xl">
          <p className="font-mono text-xs uppercase tracking-plate text-amberDark">Memberships</p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-ink md:text-4xl">
            Recurring care plans
          </h2>
          <p className="mt-3 text-steel">
            Membership pricing reflects a typical piston single. Final pricing
            depends on aircraft size, category, and condition.
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-4">
          {PLANS.map((plan) => (
            <Card
              key={plan.name}
              className={plan.featured ? "border-amber/60 ring-1 ring-amber/30" : undefined}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{plan.name}</CardTitle>
                  {plan.featured && <Badge variant="amber">Most popular</Badge>}
                </div>
                <p className="text-sm text-steel">{plan.description}</p>
              </CardHeader>
              <CardContent>
                <p className="font-display text-3xl font-semibold text-ink">
                  {plan.price}
                  <span className="text-sm font-normal text-steel2"> {plan.cadence}</span>
                </p>
                <ul className="mt-5 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-steel">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-navgreen" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button asChild className="mt-6 w-full" variant={plan.featured ? "amber" : "outline"}>
                  <Link to="/signup">{plan.price === "Custom" ? "Request a Quote" : "Choose Plan"}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
