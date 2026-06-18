import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "#services", label: "Services" },
  { href: "#pricing", label: "Pricing" },
  { href: "#membership", label: "Membership" },
  { href: "/about", label: "About", isRoute: true },
  { href: "#faq", label: "FAQ" },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 z-40 w-full transition-colors duration-300",
        scrolled ? "bg-ink/95 backdrop-blur-sm shadow-plate" : "bg-transparent"
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/">
          <BrandLogo light />
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((link) =>
            link.isRoute ? (
              <Link key={link.href} to={link.href} className="text-sm font-medium text-aluminum hover:text-paper">
                {link.label}
              </Link>
            ) : (
              <a key={link.href} href={link.href} className="text-sm font-medium text-aluminum hover:text-paper">
                {link.label}
              </a>
            )
          )}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Button asChild variant="ghost" size="sm" className="text-paper hover:bg-white/10">
            <Link to="/login">Client Login</Link>
          </Button>
          <Button asChild variant="amber" size="sm">
            <Link to="/estimate">Get an Instant Estimate</Link>
          </Button>
        </div>

        <button
          className="text-paper md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-ink px-6 py-4 md:hidden">
          <nav className="flex flex-col gap-4">
            {NAV_LINKS.map((link) =>
              link.isRoute ? (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setOpen(false)}
                  className="text-sm font-medium text-aluminum hover:text-paper"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="text-sm font-medium text-aluminum hover:text-paper"
                >
                  {link.label}
                </a>
              )
            )}
            <div className="flex flex-col gap-2 pt-2">
              <Button asChild variant="outline" className="border-white/20 text-paper">
                <Link to="/login">Client Login</Link>
              </Button>
              <Button asChild variant="amber">
                <Link to="/estimate">Get an Instant Estimate</Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
