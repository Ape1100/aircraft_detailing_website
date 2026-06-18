import { useRef, useState, type ChangeEvent } from "react";
import { ImagePlus, RotateCcw, Trash2, Wand2 } from "lucide-react";
import { Link } from "react-router-dom";
import { BackgroundPicker } from "@/components/admin/BackgroundPicker";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/lib/settings-store";

export default function AdminSettings() {
  const {
    businessSettings,
    updateBusinessSettings,
    updateInvoiceSettings,
    updateAddress,
    updateBackground,
    resetToDefaults,
  } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saved, setSaved] = useState(false);

  function handleLogoSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      updateBusinessSettings({ logoDataUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  }

  function flashSaved() {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Business Settings</h1>
          <p className="text-sm text-steel">
            Branding and invoicing details used across the site, portals, and invoices. Saved
            automatically as you type.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saved && <span className="text-sm text-navgreen">Saved</span>}
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/setup">
              <Wand2 className="h-4 w-4" /> Re-run setup wizard
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Branding</CardTitle>
          <CardDescription>Your logo and business identity.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <Label>Logo</Label>
            <div className="flex items-center gap-4">
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
              {businessSettings.logoDataUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => updateBusinessSettings({ logoDataUrl: null })}
                >
                  <Trash2 className="h-4 w-4 text-rust" /> Remove
                </Button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoSelect} />
            </div>
            <p className="mt-1.5 text-xs text-steel2">PNG or SVG with a transparent background works best.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="bs-name">Company name</Label>
              <Input
                id="bs-name"
                value={businessSettings.companyName}
                onChange={(e) => updateBusinessSettings({ companyName: e.target.value })}
                onBlur={flashSaved}
              />
            </div>
            <div>
              <Label htmlFor="bs-accent">Accent color</Label>
              <div className="flex items-center gap-2">
                <input
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

          <div>
            <Label htmlFor="bs-tagline">Tagline</Label>
            <Input
              id="bs-tagline"
              value={businessSettings.tagline}
              onChange={(e) => updateBusinessSettings({ tagline: e.target.value })}
              onBlur={flashSaved}
            />
            <p className="mt-1.5 text-xs text-steel2">Shown as the main hero headline on your landing page.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="bs-email">Contact email</Label>
              <Input
                id="bs-email"
                type="email"
                value={businessSettings.contactEmail}
                onChange={(e) => updateBusinessSettings({ contactEmail: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="bs-phone">Contact phone</Label>
              <Input
                id="bs-phone"
                value={businessSettings.contactPhone}
                onChange={(e) => updateBusinessSettings({ contactPhone: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="bs-area">Service area</Label>
            <Input
              id="bs-area"
              value={businessSettings.serviceArea}
              onChange={(e) => updateBusinessSettings({ serviceArea: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Business profile</CardTitle>
          <CardDescription>Entity type, address, and About Us content for your public profile.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <Label>Business type</Label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {(
                [
                  { value: "sole_proprietorship", label: "Sole proprietorship" },
                  { value: "corporation", label: "Corporation / LLC" },
                ] as const
              ).map(({ value, label }) => (
                <Button
                  key={value}
                  type="button"
                  size="sm"
                  variant={businessSettings.entityType === value ? "default" : "outline"}
                  onClick={() => updateBusinessSettings({ entityType: value })}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="bs-street">Street address</Label>
              <Input
                id="bs-street"
                value={businessSettings.address.street}
                onChange={(e) => updateAddress({ street: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="bs-city">City</Label>
              <Input
                id="bs-city"
                value={businessSettings.address.city}
                onChange={(e) => updateAddress({ city: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="bs-state">State</Label>
              <Input
                id="bs-state"
                value={businessSettings.address.state}
                onChange={(e) => updateAddress({ state: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="bs-zip">ZIP</Label>
              <Input
                id="bs-zip"
                value={businessSettings.address.zip}
                onChange={(e) => updateAddress({ zip: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="bs-about">About us</Label>
            <Textarea
              id="bs-about"
              rows={4}
              value={businessSettings.aboutUs}
              onChange={(e) => updateBusinessSettings({ aboutUs: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Site background</CardTitle>
          <CardDescription>Applied to the homepage hero, login/signup, and About page.</CardDescription>
        </CardHeader>
        <CardContent>
          <BackgroundPicker value={businessSettings.background} onChange={updateBackground} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invoicing</CardTitle>
          <CardDescription>Applied to new invoices across the client and admin portals.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="inv-prefix">Invoice number prefix</Label>
              <Input
                id="inv-prefix"
                value={businessSettings.invoice.invoicePrefix}
                onChange={(e) => updateInvoiceSettings({ invoicePrefix: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="inv-tax">Tax rate (%)</Label>
              <Input
                id="inv-tax"
                type="number"
                min={0}
                step={0.1}
                value={businessSettings.invoice.taxRatePercent}
                onChange={(e) => updateInvoiceSettings({ taxRatePercent: Number(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label htmlFor="inv-deposit">Deposit required (%)</Label>
              <Input
                id="inv-deposit"
                type="number"
                min={0}
                max={100}
                value={businessSettings.invoice.depositPercent}
                onChange={(e) => updateInvoiceSettings({ depositPercent: Number(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label htmlFor="inv-terms">Payment terms (days)</Label>
              <Input
                id="inv-terms"
                type="number"
                min={0}
                value={businessSettings.invoice.paymentTermsDays}
                onChange={(e) => updateInvoiceSettings({ paymentTermsDays: Number(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label htmlFor="inv-late">Late fee (%)</Label>
              <Input
                id="inv-late"
                type="number"
                min={0}
                step={0.1}
                value={businessSettings.invoice.lateFeePercent}
                onChange={(e) => updateInvoiceSettings({ lateFeePercent: Number(e.target.value) || 0 })}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="inv-footer">Invoice footer note</Label>
            <Textarea
              id="inv-footer"
              value={businessSettings.invoice.footerNote}
              onChange={(e) => updateInvoiceSettings({ footerNote: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Compliance disclaimers</CardTitle>
          <CardDescription>
            The appearance/cleaning-only disclaimer is required and cannot be edited or removed — it
            appears on every detailing report and the public site footer. You can add a supplemental
            note below if your business needs additional legal language.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="bs-custom-disclaimer">Supplemental disclaimer note (optional)</Label>
            <Textarea
              id="bs-custom-disclaimer"
              value={businessSettings.customDisclaimerNote}
              onChange={(e) => updateBusinessSettings({ customDisclaimerNote: e.target.value })}
              placeholder="Add any additional terms specific to your business..."
            />
          </div>
        </CardContent>
      </Card>

      <Button
        variant="outline"
        onClick={() => {
          if (window.confirm("Reset all branding, services, pricing, and discount settings to factory defaults?")) {
            resetToDefaults();
          }
        }}
      >
        <RotateCcw className="h-4 w-4" /> Reset everything to defaults
      </Button>
    </div>
  );
}
