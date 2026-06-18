import { Link } from "react-router-dom";
import { ArrowLeft, Mail, MapPin, Phone } from "lucide-react";
import { BrandBackdrop } from "@/components/layout/BrandBackdrop";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/lib/settings-store";

function formatEntityType(type: string) {
  return type === "corporation" ? "Corporation / LLC" : "Sole proprietorship";
}

function formatAddress(street: string, city: string, state: string, zip: string) {
  const line2 = [city, state, zip].filter(Boolean).join(", ");
  return [street, line2].filter(Boolean).join(" · ");
}

export default function AboutUs() {
  const { businessSettings, gallery } = useSettings();
  const showGallery = gallery.enabled && gallery.photos.length > 0;
  const addressLine = formatAddress(
    businessSettings.address.street,
    businessSettings.address.city,
    businessSettings.address.state,
    businessSettings.address.zip
  );

  return (
    <div className="min-h-screen bg-paper">
      <BrandBackdrop background={businessSettings.background} className="bg-ink">
        <header className="px-6 py-5">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <Link to="/">
              <BrandLogo light />
            </Link>
            <Button asChild variant="ghost" size="sm" className="text-paper hover:bg-white/10">
              <Link to="/">
                <ArrowLeft className="h-4 w-4" /> Back to home
              </Link>
            </Button>
          </div>
        </header>

        <section className="px-6 pb-20 pt-10">
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-mono text-xs uppercase tracking-plate text-amber">About {businessSettings.companyName}</p>
            <h1 className="mt-3 font-display text-4xl font-semibold text-paper md:text-5xl">{businessSettings.tagline}</h1>
            <p className="mt-2 text-sm text-aluminum">{formatEntityType(businessSettings.entityType)}</p>
          </div>
        </section>
      </BrandBackdrop>

      <main className="mx-auto max-w-4xl px-6 py-16">
        <div className="grid gap-10 md:grid-cols-[1.2fr_0.8fr]">
          <div>
            <h2 className="font-display text-xl font-semibold text-ink">Our story</h2>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-steel">
              {businessSettings.aboutUs ||
                `${businessSettings.companyName} provides mobile aircraft appearance and preservation services. Update your About Us content from Admin > Settings or the setup wizard.`}
            </p>
          </div>
          <div className="space-y-4 rounded-xl border border-ink/10 bg-white p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-steel2">Contact</h3>
            <ul className="space-y-3 text-sm text-steel">
              <li className="flex items-start gap-2">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-amberDark" />
                {businessSettings.contactEmail}
              </li>
              <li className="flex items-start gap-2">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-amberDark" />
                {businessSettings.contactPhone}
              </li>
              {addressLine && (
                <li className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amberDark" />
                  {addressLine}
                </li>
              )}
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amberDark" />
                {businessSettings.serviceArea}
              </li>
            </ul>
            <Button asChild variant="amber" className="w-full">
              <Link to="/estimate">Get an instant estimate</Link>
            </Button>
          </div>
        </div>

        {showGallery && (
          <section className="mt-20">
            <h2 className="font-display text-2xl font-semibold text-ink">Before &amp; after gallery</h2>
            <p className="mt-1 text-sm text-steel">Recent appearance work from our team.</p>
            <div className="mt-8 grid gap-8">
              {gallery.photos.map((pair) => (
                <div key={pair.id} className="overflow-hidden rounded-xl border border-ink/10 bg-white">
                  <div className="border-b border-ink/10 px-5 py-3">
                    <p className="text-sm font-medium text-ink">{pair.label}</p>
                  </div>
                  <div className="grid sm:grid-cols-2">
                    <div>
                      <p className="bg-paperDim px-4 py-2 text-xs font-semibold uppercase tracking-wide text-steel2">Before</p>
                      <img src={pair.beforeDataUrl} alt={`${pair.label} before`} className="aspect-video w-full object-cover" />
                    </div>
                    <div>
                      <p className="bg-paperDim px-4 py-2 text-xs font-semibold uppercase tracking-wide text-steel2">After</p>
                      <img src={pair.afterDataUrl} alt={`${pair.label} after`} className="aspect-video w-full object-cover" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
