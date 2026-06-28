import { Link, NavLink, Outlet } from "react-router-dom";
import { LogOut, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/layout/BrandLogo";

export interface PortalNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

interface PortalShellProps {
  navItems: PortalNavItem[];
  roleLabel: string;
  userName: string;
  onLogout: () => void;
}

export function PortalShell({ navItems, roleLabel, userName, onLogout }: PortalShellProps) {
  return (
    <div className="flex min-h-screen bg-paper">
      <aside className="hidden w-64 flex-col border-r border-ink/10 bg-white md:flex">
        <div className="border-b border-ink/10 px-6 py-5">
          <Link to="/">
            <BrandLogo />
          </Link>
          <p className="mt-0.5 text-xs uppercase tracking-wide text-steel2">{roleLabel}</p>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-steel transition-colors hover:bg-paperDim hover:text-ink",
                  isActive && "bg-ink text-paper hover:bg-ink hover:text-paper"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-ink/10 px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-ink">{userName}</p>
              <Link to="/" className="text-xs text-steel2 hover:text-ink">
                Exit portal
              </Link>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="rounded-md p-2 text-steel hover:bg-paperDim"
              aria-label="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-ink/10 bg-white px-6 py-4 md:hidden">
          <Link to="/">
            <BrandLogo />
          </Link>
          <Link to="/" className="text-sm text-steel">
            Exit
          </Link>
        </header>
        <main className="px-5 py-8 md:px-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
