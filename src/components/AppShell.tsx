import type { ReactNode } from "react";
import { Building2, Gauge, LayoutGrid, LogOut, Search, Settings, Shield } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { setStoredToken } from "@/lib/api";

const navItems = [
  { icon: Shield, href: "/structures", label: "Structures" },
  { icon: LayoutGrid, href: "/structures", label: "Portfolio" },
  { icon: Gauge, href: "/structures", label: "Monitoring" },
  { icon: Building2, href: "/structures", label: "Assets" },
  { icon: Settings, href: "/structures", label: "Settings" }
];

interface AppShellProps {
  children: ReactNode;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  action?: ReactNode;
}

export function AppShell({ children, searchValue = "", onSearchChange, action }: AppShellProps) {
  const location = useLocation();

  const handleLogout = () => {
    setStoredToken("");
    window.location.reload();
  };

  return (
    <div className="grid min-h-screen grid-cols-[84px_minmax(0,1fr)] bg-[#f4f7fb]">
      <aside className="sticky top-0 flex h-screen flex-col gap-4 border-r border-slate-200/70 bg-[#0f172a] px-4 py-5 text-white">
        <div className="grid h-14 w-14 place-items-center rounded-[20px] bg-[linear-gradient(135deg,#8b5cf6_0%,#6d28d9_100%)] text-lg font-bold text-white shadow-lg shadow-violet-500/20">
          S
        </div>
        <nav className="mt-2 flex flex-col gap-3">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const active = location.pathname.startsWith(item.href) && index === 0;
            return (
              <Link
                className={cn(
                  "grid h-14 w-14 place-items-center rounded-[18px] border border-transparent text-white/70 transition hover:bg-white/10 hover:text-white",
                  active && "border-white/10 bg-white text-slate-950"
                )}
                key={`${item.label}-${index}`}
                to={item.href}
              >
                <Icon className="h-5 w-5" />
              </Link>
            );
          })}
        </nav>
        <button
          className="mt-auto grid h-14 w-14 place-items-center rounded-[18px] border border-white/10 text-white/70 transition hover:bg-white/10 hover:text-white"
          onClick={handleLogout}
          type="button"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </aside>

      <main className="p-5 md:p-8">
        <div className="min-h-[calc(100vh-2.5rem)] rounded-[36px] border border-white/80 bg-white/85 p-5 shadow-[0_25px_80px_rgba(73,88,122,0.08)] backdrop-blur-xl md:p-6">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex w-full max-w-xl items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-3">
              <Search className="h-4 w-4 text-slate-400" />
              <Input
                className="h-auto border-0 bg-transparent p-0 shadow-none ring-0 focus:border-0 focus:ring-0"
                placeholder="Search structures, owners, UID or city"
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              {action}
            </div>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
