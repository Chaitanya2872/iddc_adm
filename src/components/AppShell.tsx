import { useState, type ReactNode } from "react";
import { LogOut, Search, Shield, Users } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { setStoredToken } from "@/lib/api";

const navItems = [
  { icon: Shield, href: "/structures", label: "Structures" },
  { icon: Users, href: "/users-access", label: "Users & Access" }
];

interface AppShellProps {
  children: ReactNode;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  action?: ReactNode;
  headerLeft?: ReactNode;
  hideSearch?: boolean;
}

export function AppShell({ children, searchValue = "", onSearchChange, action, headerLeft, hideSearch = false }: AppShellProps) {
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);

  const handleLogout = () => {
    setStoredToken("");
    window.location.reload();
  };

  return (
    <div
      className="grid min-h-screen bg-slate-100 transition-[grid-template-columns] duration-200 ease-out"
      style={{ gridTemplateColumns: expanded ? "220px minmax(0,1fr)" : "88px minmax(0,1fr)" }}
    >
      <aside
        className="sticky top-0 flex h-screen flex-col gap-4 border-r border-slate-700 bg-slate-800 px-3 py-4 text-slate-100"
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        <Link
          className={cn(
            "flex items-center overflow-hidden rounded-md border border-slate-600 bg-white transition-all duration-200",
            expanded ? "h-14 justify-start px-3" : "h-16 justify-center px-2.5"
          )}
          to="/structures"
        >
          <img
            alt="IDDC"
            className={cn(
              "w-auto max-w-full object-contain transition-all duration-200",
              expanded ? "h-8 opacity-100" : "h-7 max-w-[48px] opacity-100"
            )}
            src="/iddc-logo.png"
          />
        </Link>
        <nav className="mt-3 flex flex-col gap-2">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const active = location.pathname === item.href || location.pathname.startsWith(`${item.href}/`);
            return (
              <Link
                className={cn(
                  "flex h-11 items-center gap-3 overflow-hidden rounded-md border border-transparent px-3 text-slate-300 transition-colors duration-150 hover:bg-slate-700 hover:text-white",
                  !expanded && "h-12 w-12 justify-center self-center rounded-xl border-slate-600 bg-slate-700/70 px-0 text-white hover:bg-slate-700",
                  active && "border-slate-500 bg-slate-700 text-white"
                )}
                key={`${item.label}-${index}`}
                to={item.href}
              >
                <Icon
                  className={cn(
                    "shrink-0",
                    expanded ? "h-4 w-4 text-slate-300" : "h-[17px] w-[17px] text-white stroke-[2.2]"
                  )}
                />
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
            "mt-auto flex h-11 items-center gap-3 overflow-hidden rounded-md border border-slate-700 px-3 text-slate-300 transition-colors duration-150 hover:bg-slate-700 hover:text-white",
            !expanded && "h-12 w-12 justify-center self-center rounded-xl border-slate-600 bg-slate-700/70 px-0 text-white hover:bg-slate-700"
          )}
          onClick={handleLogout}
          type="button"
        >
          <LogOut
            className={cn(
              "shrink-0",
              expanded ? "h-4 w-4 text-slate-300" : "h-[17px] w-[17px] text-white stroke-[2.2]"
            )}
          />
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
            {hideSearch ? (
              <div className="flex items-center gap-2">{headerLeft}</div>
            ) : (
              <div className="flex w-full max-w-xl items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                <Search className="h-4 w-4 text-slate-400" />
                <Input
                  className="h-auto border-0 bg-transparent p-0 shadow-none ring-0 focus:border-0 focus:ring-0"
                  placeholder="Search workspace records"
                  value={searchValue}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                />
              </div>
            )}
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
