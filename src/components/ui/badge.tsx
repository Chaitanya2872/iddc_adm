import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const statusMap: Record<string, string> = {
  approved: "bg-emerald-100 text-emerald-700",
  validated: "bg-emerald-100 text-emerald-700",
  tested: "bg-emerald-100 text-emerald-700",
  submitted: "bg-amber-100 text-amber-700",
  under_testing: "bg-amber-100 text-amber-700",
  under_validation: "bg-amber-100 text-amber-700",
  rejected: "bg-rose-100 text-rose-700",
  draft: "bg-slate-100 text-slate-600"
};

interface BadgeProps {
  className?: string;
  tone?: string;
  children: ReactNode;
}

export function Badge({ className, tone = "default", children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em]",
        tone !== "default" ? statusMap[tone] || "bg-slate-100 text-slate-700" : "bg-slate-100 text-slate-700",
        className
      )}
    >
      {children}
    </span>
  );
}
