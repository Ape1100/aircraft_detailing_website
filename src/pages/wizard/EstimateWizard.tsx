import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Camera, Check, Plane, Save, ShieldAlert, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { NNumberPlate } from "@/components/aviation/NNumberPlate";
import { ConfidenceGauge } from "@/components/aviation/ConfidenceGauge";
import { PayabilityBadge } from "@/components/aviation/PayabilityBadge";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { OptionCard, StepShell } from "@/components/wizard/WizardChrome";
import { calculateEstimate } from "@/lib/pricing-engine";
import { useSettings } from "@/lib/settings-store";
import { formatCurrency, cn } from "@/lib/utils";
import { ESTIMATE_DISCLAIMER, type AircraftCategory, type AircraftCondition, type EstimateInput } from "@/types";
import { CATEGORY_OPTIONS, CONDITION_OPTIONS, MAKES, MODELS_BY_MAKE } from "@/pages/wizard/wizard-data";

const TOTAL_STEPS = 10;

const STEP_TITLES = [
  "Aircraft category",
  "Aircraft make",
  "Aircraft model",
  "Tail number",
  "Current condition",
  "Desired services",
  "Airport location",
  "Photos",
  "Your instant estimate",
  "Next steps",
];

function toggleInArray<T>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

export default function EstimateWizard() {
  const { services, pricingConfig, discountRules } = useSettings();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<EstimateInput>({
    category: "piston_single",
    make: "",
    model: "",
    tailNumber: "",
    condition: [],
    services: [],
    airport: "",
    fbo: "",
    hangarNumber: "",
    rampParked: false,
    travelDistanceMiles: 0,
    photoCount: 0,
  });
  const [convertChoice, setConvertChoice] = useState<string | null>(null);

  const estimate = useMemo(
    () => calculateEstimate(form, services, pricingConfig, { discountRules }),
    [form, services, pricingConfig, discountRules]
  );

  const canAdvance = useMemo(() => {
    if (step === 2) return form.make.trim().length > 0;
    if (step === 3) return form.model.trim().length > 0;
    if (step === 7) return form.airport.trim().length > 0;
    return true;
  }, [step, form]);

  function next() {
    if (step < TOTAL_STEPS) setStep(step + 1);
  }
  function back() {
    if (step > 1) setStep(step - 1);
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-ink/10 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link to="/">
            <BrandLogo />
          </Link>
          <span className="text-xs text-steel2">Step {step} of {TOTAL_STEPS}</span>
        </div>
        <div className="mx-auto mt-3 max-w-3xl">
          <Progress value={(step / TOTAL_STEPS) * 100} />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="font-mono text-xs uppercase tracking-plate text-amberDark">
          {STEP_TITLES[step - 1]}
        </p>

        {step === 1 && (
          <StepShell title="What kind of aircraft is this?">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {CATEGORY_OPTIONS.map((opt) => (
                <OptionCard
                  key={opt.value}
                  selected={form.category === opt.value}
                  onClick={() => setForm((f) => ({ ...f, category: opt.value as AircraftCategory }))}
                >
                  {opt.label}
                </OptionCard>
              ))}
            </div>
          </StepShell>
        )}

        {step === 2 && (
          <StepShell title="Who makes it?">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {MAKES.map((make) => (
                <OptionCard
                  key={make}
                  selected={form.make === make}
                  onClick={() => setForm((f) => ({ ...f, make, model: "" }))}
                >
                  {make}
                </OptionCard>
              ))}
            </div>
          </StepShell>
        )}

        {step === 3 && (
          <StepShell title={`Which ${form.make || "aircraft"} model?`}>
            {MODELS_BY_MAKE[form.make]?.length ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {MODELS_BY_MAKE[form.make].map((model) => (
                  <OptionCard
                    key={model}
                    selected={form.model === model}
                    onClick={() => setForm((f) => ({ ...f, model }))}
                  >
                    {model}
                  </OptionCard>
                ))}
              </div>
            ) : (
              <div className="max-w-sm">
                <Label htmlFor="model-input">Model</Label>
                <Input
                  id="model-input"
                  value={form.model}
                  onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                  placeholder="Enter the model"
                />
              </div>
            )}
          </StepShell>
        )}

        {step === 4 && (
          <StepShell title="What's the tail number? (optional)">
            <div className="max-w-sm space-y-4">
              <div>
                <Label htmlFor="tail-input">Tail number</Label>
                <Input
                  id="tail-input"
                  value={form.tailNumber}
                  onChange={(e) => setForm((f) => ({ ...f, tailNumber: e.target.value.toUpperCase() }))}
                  placeholder="N12345"
                  className="font-mono uppercase tracking-wide"
                />
              </div>
              {form.tailNumber && <NNumberPlate tailNumber={form.tailNumber} />}
              <Button variant="subtle" size="sm" disabled className="cursor-not-allowed">
                <Plane className="h-4 w-4" /> Look up FAA registration (coming soon)
              </Button>
              <p className="text-xs text-steel2">
                In a future release, entering a tail number will auto-fill
                year, dimensions, and weight from the FAA registry.
              </p>
            </div>
          </StepShell>
        )}

        {step === 5 && (
          <StepShell title="What condition is it in right now?" subtitle="Select all that apply.">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {CONDITION_OPTIONS.map((opt) => (
                <OptionCard
                  key={opt.value}
                  selected={form.condition.includes(opt.value)}
                  onClick={() =>
                    setForm((f) => ({ ...f, condition: toggleInArray(f.condition, opt.value as AircraftCondition) }))
                  }
                >
                  {opt.label}
                </OptionCard>
              ))}
            </div>
          </StepShell>
        )}

        {step === 6 && (
          <StepShell title="What services are you interested in?" subtitle="Select all that apply.">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {services.map((opt) => (
                <OptionCard
                  key={opt.code}
                  selected={form.services.includes(opt.code)}
                  onClick={() =>
                    setForm((f) => ({ ...f, services: toggleInArray(f.services, opt.code) }))
                  }
                >
                  {opt.name}
                </OptionCard>
              ))}
            </div>
          </StepShell>
        )}

        {step === 7 && (
          <StepShell title="Where is the aircraft located?">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="airport-input">Airport</Label>
                <Input
                  id="airport-input"
                  required
                  value={form.airport}
                  onChange={(e) => setForm((f) => ({ ...f, airport: e.target.value }))}
                  placeholder="KSAC — Sacramento Executive"
                />
              </div>
              <div>
                <Label htmlFor="fbo-input">FBO</Label>
                <Input
                  id="fbo-input"
                  value={form.fbo}
                  onChange={(e) => setForm((f) => ({ ...f, fbo: e.target.value }))}
                  placeholder="Sacramento Jet Center"
                />
              </div>
              <div>
                <Label htmlFor="hangar-input">Hangar number</Label>
                <Input
                  id="hangar-input"
                  value={form.hangarNumber}
                  onChange={(e) => setForm((f) => ({ ...f, hangarNumber: e.target.value }))}
                  placeholder="Hangar 14"
                />
              </div>
              <div className="flex items-end gap-3 pb-1">
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, rampParked: !f.rampParked }))}
                  className={cn(
                    "flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border text-sm font-medium transition-colors",
                    form.rampParked ? "border-amber bg-amber/10 text-amberDark" : "border-ink/15 text-steel"
                  )}
                >
                  {form.rampParked && <Check className="h-4 w-4" />} Ramp parked
                </button>
              </div>
              <div>
                <Label htmlFor="travel-input">Travel distance (miles)</Label>
                <Input
                  id="travel-input"
                  type="number"
                  min={0}
                  value={form.travelDistanceMiles}
                  onChange={(e) => setForm((f) => ({ ...f, travelDistanceMiles: Number(e.target.value) || 0 }))}
                />
              </div>
            </div>
          </StepShell>
        )}

        {step === 8 && (
          <StepShell title="Add photos" subtitle="Up to 20 photos. This helps us scope the job accurately.">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                {Array.from({ length: form.photoCount }).map((_, i) => (
                  <div key={i} className="flex h-20 w-20 items-center justify-center rounded-lg border border-ink/10 bg-paperDim text-steel2">
                    <Camera className="h-5 w-5" />
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={form.photoCount >= 20}
                onClick={() => setForm((f) => ({ ...f, photoCount: Math.min(20, f.photoCount + 1) }))}
              >
                <Camera className="h-4 w-4" /> Add photo (mock upload)
              </Button>
              <p className="text-xs text-steel2">
                {form.photoCount} of 20 added. In a future release, photos
                will support AI-assisted condition assessment.
              </p>
            </div>
          </StepShell>
        )}

        {step === 9 && (
          <StepShell title="Here's your instant estimate">
            {form.services.filter((s) => s !== "membership_quote").length === 0 ? (
              <p className="text-sm text-steel">
                Go back to step 6 and select at least one service to see a
                price estimate.
              </p>
            ) : (
              <div className="space-y-8">
                <div className="flex flex-col items-center gap-4 rounded-xl border border-ink/10 bg-white p-8 text-center">
                  <PayabilityBadge payable={false} />
                  <p className="text-xs uppercase tracking-wide text-steel2">Estimated price range</p>
                  <p className="font-display text-4xl font-semibold text-ink">
                    {formatCurrency(estimate.low)} – {formatCurrency(estimate.high)}
                  </p>
                  <p className="text-sm text-steel">
                    Estimated labor: {estimate.laborHoursLow}–{estimate.laborHoursHigh} hours
                  </p>
                  <ConfidenceGauge confidence={estimate.confidence} />
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-steel2">Recommended package</p>
                    <p className="mt-1 font-display text-lg text-ink">{estimate.recommendedPackage}</p>
                  </div>
                  {estimate.recommendedAddOns.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-steel2">Suggested add-ons</p>
                      <ul className="mt-1 space-y-1">
                        {estimate.recommendedAddOns.map((a) => (
                          <li key={a} className="text-sm text-ink">{a}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {estimate.appliedDiscounts.length > 0 && (
                  <div className="rounded-lg border border-navgreen/30 bg-navgreen/5 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-navgreen">Discounts applied</p>
                    <ul className="mt-1 space-y-0.5">
                      {estimate.appliedDiscounts.map((d) => (
                        <li key={d.label} className="text-sm text-ink">
                          {d.label} — saved {formatCurrency(d.amount)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-steel2">Breakdown</p>
                  <div className="mt-2 divide-y divide-ink/10 rounded-lg border border-ink/10 bg-white">
                    {estimate.breakdown.map((line, i) => (
                      <div key={i} className="flex justify-between px-4 py-2.5 text-sm">
                        <span className="text-steel">{line.label}</span>
                        <span className="font-mono text-ink">
                          {line.amount < 0 ? "-" : ""}{formatCurrency(Math.abs(line.amount))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg border border-amber/40 bg-amber/10 px-4 py-3">
                  <ShieldAlert className="mt-0.5 h-4 w-4 flex-shrink-0 text-amberDark" />
                  <p className="text-sm text-amberDark">{ESTIMATE_DISCLAIMER}</p>
                </div>
              </div>
            )}
          </StepShell>
        )}

        {step === 10 && (
          <StepShell title="What would you like to do next?">
            {convertChoice ? (
              <div className="rounded-xl border border-navgreen/30 bg-navgreen/5 p-6 text-center">
                <p className="font-display text-lg font-semibold text-ink">Got it.</p>
                <p className="mt-1 text-sm text-steel">
                  Your estimate has been noted as: <strong>{convertChoice}</strong>. Create an
                  account to track this request going forward.
                </p>
                <Button asChild variant="amber" className="mt-4">
                  <Link to="/signup">Create Account</Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <Button asChild variant="amber" size="lg" className="justify-start">
                  <Link to="/signup">
                    <UserPlus className="h-4 w-4" /> Create Account
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="justify-start" onClick={() => setConvertChoice("Save Estimate")}>
                  <Save className="h-4 w-4" /> Save Estimate
                </Button>
                <Button variant="outline" size="lg" className="justify-start" onClick={() => setConvertChoice("Schedule Service")}>
                  Schedule Service
                </Button>
                <Button variant="outline" size="lg" className="justify-start" onClick={() => setConvertChoice("Request Final Quote")}>
                  Request Final Quote
                </Button>
                <p className="text-xs text-steel2 sm:col-span-2">
                  Payment isn't available from an instant estimate — every job is verified in person
                  and finalized into a quote first. Use "Request Final Quote" above to start that.
                </p>
              </div>
            )}
          </StepShell>
        )}

        <div className="mt-10 flex justify-between">
          <Button variant="ghost" onClick={back} disabled={step === 1}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          {step < TOTAL_STEPS && (
            <Button variant="amber" onClick={next} disabled={!canAdvance}>
              Next <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
