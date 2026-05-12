import { useState, type ReactNode } from "react";
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
  const [expanded, setExpanded] = useState(false);

  const handleLogout = () => {
    setStoredToken("");
    window.location.reload();
  };

  return (
    <div
      className="grid min-h-screen bg-[#f4f7fb] transition-[grid-template-columns] duration-300 ease-out"
      style={{ gridTemplateColumns: expanded ? "248px minmax(0,1fr)" : "88px minmax(0,1fr)" }}
    >
      <aside
        className="sticky top-0 flex h-screen flex-col gap-4 border-r border-slate-200/70 bg-[radial-gradient(circle_at_top,#1e293b_0%,#0f172a_45%,#020617_100%)] px-4 py-5 text-white shadow-[inset_-1px_0_0_rgba(255,255,255,0.05)]"
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        <div className={cn("flex items-center gap-3 overflow-hidden rounded-[22px] border border-white/10 bg-white/5 p-2 transition-all duration-300", expanded ? "pr-4" : "w-14 justify-center")}>
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[16px] bg-[linear-gradient(135deg,#38bdf8_0%,#0ea5e9_45%,#22c55e_100%)] text-lg font-bold text-white shadow-lg shadow-sky-500/20">
            S
          </div>
          <div
            className={cn(
              "min-w-0 transition-all duration-200",
              expanded ? "translate-x-0 opacity-100" : "pointer-events-none -translate-x-2 opacity-0"
            )}
          >
            <p className="text-sm font-semibold tracking-[0.14em] text-white/80">SAMS</p>
            <p className="text-xs text-white/45">Admin workspace</p>
          </div>
        </div>
        <nav className="mt-2 flex flex-col gap-3">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const active = location.pathname.startsWith(item.href) && index === 0;
            return (
              <Link
                className={cn(
                  "flex h-14 items-center gap-3 overflow-hidden rounded-[18px] border border-transparent px-4 text-white/70 transition-all duration-300 hover:border-white/10 hover:bg-white/10 hover:text-white",
                  !expanded && "w-14 justify-center px-0",
                  active && "border-white/10 bg-white text-slate-950 shadow-[0_8px_30px_rgba(255,255,255,0.18)]"
                )}
                key={`${item.label}-${index}`}
                to={item.href}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span
                  className={cn(
                    "whitespace-nowrap text-sm font-medium transition-all duration-200",
                    expanded ? "translate-x-0 opacity-100" : "pointer-events-none -translate-x-2 opacity-0"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
        <button
          className={cn(
            "mt-auto flex h-14 items-center gap-3 overflow-hidden rounded-[18px] border border-white/10 px-4 text-white/70 transition-all duration-300 hover:bg-white/10 hover:text-white",
            !expanded && "w-14 justify-center px-0"
          )}
          onClick={handleLogout}
          type="button"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span
            className={cn(
              "whitespace-nowrap text-sm font-medium transition-all duration-200",
              expanded ? "translate-x-0 opacity-100" : "pointer-events-none -translate-x-2 opacity-0"
            )}
          >
            Log out
          </span>
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
