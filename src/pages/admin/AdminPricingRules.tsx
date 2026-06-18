import { Fragment } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSettings } from "@/lib/settings-store";
import { CATEGORY_OPTIONS, CONDITION_OPTIONS } from "@/pages/wizard/wizard-data";
import type { MembershipTier } from "@/types";

const MEMBERSHIP_TIERS: { value: MembershipTier; label: string }[] = [
  { value: "ramp_ready", label: "Ramp Ready" },
  { value: "owner_care", label: "Owner Care" },
  { value: "preservation", label: "Preservation" },
  { value: "fleet_fbo", label: "Fleet / FBO" },
];

export default function AdminPricingRules() {
  const {
    pricingConfig,
    updateSizeMultiplier,
    updateCategoryComplexityMultiplier,
    updateConditionModifier,
    updateMembershipDiscount,
    updateTravelRules,
    updateBlendedHourlyRate,
  } = useSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Pricing Rules</h1>
        <p className="text-sm text-steel">
          The multipliers behind every instant estimate. Tune these to match your aircraft mix,
          labor rate, and market — every estimate recalculates immediately.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Aircraft size &amp; complexity multipliers</CardTitle>
          <CardDescription>Applied to each selected service's base price.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 gap-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-steel2">Category</p>
            <p className="text-xs font-semibold uppercase tracking-wide text-steel2">Size ×</p>
            <p className="text-xs font-semibold uppercase tracking-wide text-steel2">Complexity ×</p>
            {CATEGORY_OPTIONS.map((opt) => (
              <Fragment key={opt.value}>
                <Label className="mb-0 text-sm font-normal text-ink">
                  {opt.label}
                </Label>
                <Input
                  type="number"
                  step={0.05}
                  className="w-24"
                  value={pricingConfig.sizeMultiplier[opt.value]}
                  onChange={(e) => updateSizeMultiplier(opt.value, Number(e.target.value) || 0)}
                />
                <Input
                  type="number"
                  step={0.05}
                  className="w-24"
                  value={pricingConfig.categoryComplexityMultiplier[opt.value]}
                  onChange={(e) => updateCategoryComplexityMultiplier(opt.value, Number(e.target.value) || 0)}
                />
              </Fragment>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Condition modifiers</CardTitle>
          <CardDescription>Each selected condition stacks multiplicatively (1.0 = no change).</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3">
            {CONDITION_OPTIONS.map((opt) => (
              <Fragment key={opt.value}>
                <Label className="mb-0 text-sm font-normal text-ink">
                  {opt.label}
                </Label>
                <Input
                  type="number"
                  step={0.01}
                  className="w-24"
                  value={pricingConfig.conditionModifier[opt.value]}
                  onChange={(e) => updateConditionModifier(opt.value, Number(e.target.value) || 0)}
                />
              </Fragment>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Membership discounts</CardTitle>
          <CardDescription>Applied automatically to estimates for clients on a membership plan.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3">
            {MEMBERSHIP_TIERS.map((tier) => (
              <Fragment key={tier.value}>
                <Label className="mb-0 text-sm font-normal text-ink">
                  {tier.label}
                </Label>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    step={1}
                    className="w-20"
                    value={Math.round(pricingConfig.membershipDiscount[tier.value] * 100)}
                    onChange={(e) => updateMembershipDiscount(tier.value, (Number(e.target.value) || 0) / 100)}
                  />
                  <span className="text-sm text-steel2">%</span>
                </div>
              </Fragment>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Travel &amp; labor</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="pr-radius">Free travel radius (miles)</Label>
            <Input
              id="pr-radius"
              type="number"
              min={0}
              value={pricingConfig.travelRules.freeRadiusMiles}
              onChange={(e) => updateTravelRules({ freeRadiusMiles: Number(e.target.value) || 0 })}
            />
          </div>
          <div>
            <Label htmlFor="pr-rate">Rate per mile beyond that ($)</Label>
            <Input
              id="pr-rate"
              type="number"
              min={0}
              step={0.5}
              value={pricingConfig.travelRules.ratePerMile}
              onChange={(e) => updateTravelRules({ ratePerMile: Number(e.target.value) || 0 })}
            />
          </div>
          <div>
            <Label htmlFor="pr-hourly">Blended hourly shop rate ($)</Label>
            <Input
              id="pr-hourly"
              type="number"
              min={0}
              value={pricingConfig.blendedHourlyRate}
              onChange={(e) => updateBlendedHourlyRate(Number(e.target.value) || 0)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
