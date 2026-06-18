import { Link } from "react-router-dom";
import { useSettings } from "@/lib/settings-store";
import { BrandLogo } from "@/components/layout/BrandLogo";

export function SiteFooter() {
  const { businessSettings } = useSettings();

  return (
    <footer className="bg-ink px-6 py-14 text-aluminum">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <BrandLogo light />
            <p className="mt-3 max-w-xs text-sm text-aluminum/80">
              {businessSettings.tagline}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-aluminum/60">Company</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li><a href="#services" className="hover:text-paper">Services</a></li>
              <li><a href="#pricing" className="hover:text-paper">Pricing</a></li>
              <li><a href="#membership" className="hover:text-paper">Membership</a></li>
              <li><a href="#faq" className="hover:text-paper">FAQ</a></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-aluminum/60">Account</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link to="/login" className="hover:text-paper">Client Login</Link></li>
              <li><Link to="/signup" className="hover:text-paper">Create Account</Link></li>
              <li><Link to="/estimate" className="hover:text-paper">Instant Estimate</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-aluminum/60">Contact</p>
            <ul className="mt-3 space-y-2 text-sm text-aluminum/80">
              <li>{businessSettings.contactEmail}</li>
              <li>{businessSettings.serviceArea}</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-white/10 pt-6 text-xs text-aluminum/60">
          <p>
            {businessSettings.companyName} provides aircraft appearance, cleaning, and preservation
            services only. {businessSettings.companyName} does not perform FAA inspections, aircraft
            maintenance, repairs, or airworthiness determinations. Maintenance
            concerns should be referred to a qualified A&amp;P mechanic, IA, or
            approved maintenance provider.
          </p>
          {businessSettings.customDisclaimerNote && (
            <p className="mt-3">{businessSettings.customDisclaimerNote}</p>
          )}
          <p className="mt-3">© {new Date().getFullYear()} {businessSettings.companyName}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
