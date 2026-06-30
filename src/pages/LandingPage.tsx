import { Seo } from "@/components/Seo";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Hero } from "@/pages/landing/Hero";
import { TrustBar } from "@/pages/landing/TrustBar";
import { Services } from "@/pages/landing/Services";
import { Pricing } from "@/pages/landing/Pricing";
import { Memberships } from "@/pages/landing/Memberships";
import { QuoteForm } from "@/pages/landing/QuoteForm";
import { FAQ } from "@/pages/landing/FAQ";

export default function LandingPage() {
  return (
    <div>
      <Seo path="/" />
      <SiteHeader />
      <Hero />
      <TrustBar />
      <Services />
      <Pricing />
      <Memberships />
      <QuoteForm />
      <FAQ />
      <SiteFooter />
    </div>
  );
}
