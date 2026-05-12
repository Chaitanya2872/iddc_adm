import { useState, type ReactNode } from "react";
import { KeyRound, LogOut, Search, Shield, Users } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { setStoredToken } from "@/lib/api";

const navItems = [
  { icon: Shield, href: "/structures", label: "Structures" },
  { icon: Users, href: "/structures", label: "Users" },
  { icon: KeyRound, href: "/structures", label: "Access" }
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
      className="grid min-h-screen bg-slate-100 transition-[grid-template-columns] duration-200 ease-out"
      style={{ gridTemplateColumns: expanded ? "220px minmax(0,1fr)" : "76px minmax(0,1fr)" }}
    >
      <aside
        className="sticky top-0 flex h-screen flex-col gap-3 border-r border-slate-800 bg-slate-900 px-3 py-4 text-slate-100"
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        <Link
          className={cn(
            "flex h-12 items-center overflow-hidden transition-all duration-200",
            expanded ? "justify-start px-2" : "justify-center"
          )}
          to="/structures"
        >
          <img
            alt="IDDC"
            className={cn(
              "h-9 w-auto max-w-none object-contain transition-all duration-200",
              expanded ? "opacity-100" : "scale-90 opacity-100"
            )}
            src="/iddc-logo.png"
          />
        </Link>
        <nav className="mt-3 flex flex-col gap-1.5">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const active = location.pathname.startsWith(item.href) && index === 0;
            return (
              <Link
                className={cn(
                  "flex h-11 items-center gap-3 overflow-hidden rounded-md border border-transparent px-3 text-slate-400 transition-colors duration-150 hover:bg-slate-800 hover:text-slate-100",
                  !expanded && "w-10 justify-center self-center px-0",
                  active && "border-slate-700 bg-slate-800 text-slate-50"
                )}
                key={`${item.label}-${index}`}
                to={item.href}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span
                  className={cn(
                    "whitespace-nowrap text-sm font-medium transition-all duration-150",
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
            "mt-auto flex h-11 items-center gap-3 overflow-hidden rounded-md border border-slate-800 px-3 text-slate-400 transition-colors duration-150 hover:bg-slate-800 hover:text-slate-100",
            !expanded && "w-10 justify-center self-center px-0"
          )}
          onClick={handleLogout}
          type="button"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span
            className={cn(
              "whitespace-nowrap text-sm font-medium transition-all duration-150",
              expanded ? "translate-x-0 opacity-100" : "pointer-events-none -translate-x-2 opacity-0"
            )}
          >
            Log out
          </span>
        </button>
      </aside>

      <main className="p-4 md:p-6">
        <div className="min-h-[calc(100vh-2rem)] rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex w-full max-w-xl items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
              <Search className="h-4 w-4 text-slate-400" />
              <Input
                className="h-auto border-0 bg-transparent p-0 shadow-none ring-0 focus:border-0 focus:ring-0"
                placeholder="Search structures, owners, UID or city"
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              {action}
            </div>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
