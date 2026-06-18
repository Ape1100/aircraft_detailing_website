import { useRef, useState, type ChangeEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Building2, ImagePlus, MapPin, Sparkles } from "lucide-react";
import { BackgroundPicker } from "@/components/admin/BackgroundPicker";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { OptionCard, StepShell } from "@/components/wizard/WizardChrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useSettings } from "@/lib/settings-store";
import type { BusinessEntityType } from "@/types";

const TOTAL_STEPS = 5;

const STEP_TITLES = [
  "Business type",
  "Location & coverage",
  "Contact & about",
  "Logo & branding",
  "Site background",
];

export default function SetupWizard() {
  const navigate = useNavigate();
  const {
    businessSettings,
    updateBusinessSettings,
    updateAddress,
    updateBackground,
    completeSetup,
  } = useSettings();
  const [step, setStep] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleLogoSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateBusinessSettings({ logoDataUrl: reader.result as string });
    reader.readAsDataURL(file);
  }

  function finish() {
    completeSetup();
    navigate("/admin/dashboard");
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-ink/10 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link to="/admin/dashboard">
            <BrandLogo />
          </Link>
          <span className="text-xs text-steel2">Setup · Step {step} of {TOTAL_STEPS}</span>
        </div>
        <div className="mx-auto mt-3 max-w-3xl">
          <Progress value={(step / TOTAL_STEPS) * 100} />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="font-mono text-xs uppercase tracking-plate text-amberDark">{STEP_TITLES[step - 1]}</p>

        {step === 1 && (
          <StepShell
            title="What kind of business are you?"
            subtitle="This helps personalize your About page and client-facing profile."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  { value: "sole_proprietorship" as BusinessEntityType, label: "Sole proprietorship", icon: Sparkles },
                  { value: "corporation" as BusinessEntityType, label: "Corporation / LLC", icon: Building2 },
                ] as const
              ).map(({ value, label, icon: Icon }) => (
                <OptionCard
                  key={value}
                  selected={businessSettings.entityType === value}
                  onClick={() => updateBusinessSettings({ entityType: value })}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4" /> {label}
                  </span>
                </OptionCard>
              ))}
            </div>
          </StepShell>
        )}

        {step === 2 && (
          <StepShell title="Where do you operate?" subtitle="Your address and mobile service coverage area.">
            <div className="space-y-4">
              <div>
                <Label htmlFor="sw-street">Street address</Label>
                <Input
                  id="sw-street"
                  value={businessSettings.address.street}
                  onChange={(e) => updateAddress({ street: e.target.value })}
                  placeholder="123 Aviation Way"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor="sw-city">City</Label>
                  <Input
                    id="sw-city"
                    value={businessSettings.address.city}
                    onChange={(e) => updateAddress({ city: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="sw-state">State</Label>
                  <Input
                    id="sw-state"
                    value={businessSettings.address.state}
                    onChange={(e) => updateAddress({ state: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="sw-zip">ZIP</Label>
                  <Input
                    id="sw-zip"
                    value={businessSettings.address.zip}
                    onChange={(e) => updateAddress({ zip: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="sw-area">Area of coverage</Label>
                <Input
                  id="sw-area"
                  value={businessSettings.serviceArea}
                  onChange={(e) => updateBusinessSettings({ serviceArea: e.target.value })}
                  placeholder="Mobile service — Sacramento metro & Bay Area FBOs"
                />
                <p className="mt-1.5 flex items-center gap-1 text-xs text-steel2">
                  <MapPin className="h-3 w-3" /> Shown on your About page and landing footer.
                </p>
              </div>
            </div>
          </StepShell>
        )}

        {step === 3 && (
          <StepShell title="How can clients reach you?" subtitle="Contact details and your About Us story.">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="sw-email">Contact email</Label>
                  <Input
                    id="sw-email"
                    type="email"
                    value={businessSettings.contactEmail}
                    onChange={(e) => updateBusinessSettings({ contactEmail: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="sw-phone">Contact phone</Label>
                  <Input
                    id="sw-phone"
                    value={businessSettings.contactPhone}
                    onChange={(e) => updateBusinessSettings({ contactPhone: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="sw-about">About us</Label>
                <Textarea
                  id="sw-about"
                  rows={5}
                  value={businessSettings.aboutUs}
                  onChange={(e) => updateBusinessSettings({ aboutUs: e.target.value })}
                  placeholder="Tell clients about your team, experience, and approach to aircraft appearance care..."
                />
              </div>
            </div>
          </StepShell>
        )}

        {step === 4 && (
          <StepShell title="Brand your business" subtitle="Logo, name, tagline, and accent color.">
            <div className="space-y-5">
              <div>
                <Label>Logo (optional)</Label>
                <div className="mt-1.5 flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-ink/15 bg-paperDim">
                    {businessSettings.logoDataUrl ? (
                      <img src={businessSettings.logoDataUrl} alt="Logo" className="h-full w-full object-contain p-1" />
                    ) : (
                      <ImagePlus className="h-5 w-5 text-steel2" />
                    )}
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    Upload logo
                  </Button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoSelect} />
                </div>
              </div>
              <div>
                <Label htmlFor="sw-name">Company name</Label>
                <Input
                  id="sw-name"
                  value={businessSettings.companyName}
                  onChange={(e) => updateBusinessSettings({ companyName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="sw-tagline">Tagline</Label>
                <Input
                  id="sw-tagline"
                  value={businessSettings.tagline}
                  onChange={(e) => updateBusinessSettings({ tagline: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="sw-accent">Accent color</Label>
                <div className="mt-1.5 flex items-center gap-2">
                  <input
                    id="sw-accent"
                    type="color"
                    value={businessSettings.accentColorHex}
                    onChange={(e) => updateBusinessSettings({ accentColorHex: e.target.value })}
                    className="h-11 w-14 cursor-pointer rounded-lg border border-ink/15"
                  />
                  <Input
                    value={businessSettings.accentColorHex}
                    onChange={(e) => updateBusinessSettings({ accentColorHex: e.target.value })}
                    className="font-mono"
                  />
                </div>
              </div>
            </div>
          </StepShell>
        )}

        {step === 5 && (
          <StepShell
            title="Choose a site background"
            subtitle="Pick a sample aircraft photo, upload your own, or use a solid color. Applied to your hero, login, and About page."
          >
            <BackgroundPicker value={businessSettings.background} onChange={updateBackground} />
          </StepShell>
        )}

        <div className="mt-10 flex justify-between">
          <Button variant="ghost" onClick={() => (step > 1 ? setStep(step - 1) : navigate("/admin/dashboard"))}>
            <ArrowLeft className="h-4 w-4" /> {step === 1 ? "Skip for now" : "Back"}
          </Button>
          {step < TOTAL_STEPS ? (
            <Button variant="amber" onClick={() => setStep(step + 1)}>
              Next <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button variant="amber" onClick={finish}>
              Finish setup
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
