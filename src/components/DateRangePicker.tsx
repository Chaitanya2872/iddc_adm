import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarRange, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DateRangePickerProps = {
  from: string;
  to: string;
  onApply: (next: { from: string; to: string }) => void;
};

type PresetKey =
  | "today"
  | "yesterday"
  | "last7"
  | "last30"
  | "thisMonth"
  | "lastMonth"
  | "thisYear"
  | "allTime";

type PopoverPosition = {
  top: number;
  left: number;
  width: number;
  openUpward: boolean;
  compact: boolean;
  mounted: boolean;
};

const WEEK_DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const VIEWPORT_GAP = 16;
const DESKTOP_WIDTH = 804;
const COMPACT_WIDTH = 348;
const POPOVER_HEIGHT = 500;

function parseDate(value?: string) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function toIsoDate(date: Date | null) {
  if (!date) return "";
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function isSameDay(a: Date | null, b: Date | null) {
  return Boolean(a && b && toIsoDate(a) === toIsoDate(b));
}

function isBetween(date: Date, from: Date | null, to: Date | null) {
  if (!from || !to) return false;
  const current = startOfDay(date).getTime();
  return current > startOfDay(from).getTime() && current < startOfDay(to).getTime();
}

function formatDisplayDate(value: string) {
  const date = parseDate(value);
  if (!date) return "";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function getPresetRange(key: PresetKey) {
  const today = startOfDay(new Date());

  switch (key) {
    case "today":
      return { from: today, to: today };
    case "yesterday": {
      const date = addDays(today, -1);
      return { from: date, to: date };
    }
    case "last7":
      return { from: addDays(today, -6), to: today };
    case "last30":
      return { from: addDays(today, -29), to: today };
    case "thisMonth":
      return { from: startOfMonth(today), to: today };
    case "lastMonth": {
      const lastMonth = addMonths(today, -1);
      return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
    }
    case "thisYear":
      return { from: new Date(today.getFullYear(), 0, 1), to: today };
    case "allTime":
      return { from: null, to: null };
    default:
      return { from: null, to: null };
  }
}

function buildCalendarDays(monthDate: Date) {
  const firstDay = startOfMonth(monthDate);
  const lastDay = endOfMonth(monthDate);
  const offset = (firstDay.getDay() + 6) % 7;
  const days: Date[] = [];

  for (let index = offset; index > 0; index -= 1) {
    days.push(addDays(firstDay, -index));
  }

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    days.push(new Date(monthDate.getFullYear(), monthDate.getMonth(), day));
  }

  while (days.length % 7 !== 0) {
    days.push(addDays(days[days.length - 1], 1));
  }

  return days;
}

const PRESETS: Array<{ key: PresetKey; label: string }> = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "last7", label: "Last 7 days" },
  { key: "last30", label: "Last 30 days" },
  { key: "thisMonth", label: "This month" },
  { key: "lastMonth", label: "Last month" },
  { key: "thisYear", label: "This year" },
  { key: "allTime", label: "All time" }
];

function CalendarMonth({
  month,
  rangeFrom,
  rangeTo,
  onSelect,
  compact = false
}: {
  month: Date;
  rangeFrom: Date | null;
  rangeTo: Date | null;
  onSelect: (date: Date) => void;
  compact?: boolean;
}) {
  const days = useMemo(() => buildCalendarDays(month), [month]);

  return (
    <div className={cn("px-4 py-3", compact ? "min-w-0" : "min-w-[286px]")}>
      <div className="mb-3 text-center text-base font-semibold tracking-[-0.03em] text-slate-800">
        {month.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
      </div>
      <div className="mb-2 grid grid-cols-7 gap-y-2 text-center text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
        {WEEK_DAYS.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1.5 text-center">
        {days.map((day) => {
          const isCurrentMonth = day.getMonth() === month.getMonth();
          const isStart = isSameDay(day, rangeFrom);
          const isEnd = isSameDay(day, rangeTo);
          const inRange = isBetween(day, rangeFrom, rangeTo);

          return (
            <div className="flex justify-center" key={`${month.toISOString()}-${day.toISOString()}`}>
              <button
                className={cn(
                  "relative flex h-9 w-9 items-center justify-center rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-200",
                  isCurrentMonth ? "text-slate-700" : "text-slate-300",
                  inRange ? "bg-indigo-50 text-indigo-700" : "hover:bg-slate-100",
                  isStart || isEnd ? "bg-indigo-500 font-semibold text-white hover:bg-indigo-500" : ""
                )}
                onClick={() => onSelect(day)}
                type="button"
              >
                {day.getDate()}
                {isCurrentMonth && !isStart && !isEnd ? (
                  <span
                    className={cn(
                      "absolute bottom-1 h-1 w-1 rounded-full",
                      inRange ? "bg-indigo-400" : "bg-slate-300"
                    )}
                  />
                ) : null}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getPopoverPosition(triggerRect: DOMRect): PopoverPosition {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const compact = viewportWidth < 980;
  const width = Math.min(compact ? COMPACT_WIDTH : DESKTOP_WIDTH, viewportWidth - VIEWPORT_GAP * 2);

  let left = triggerRect.left;
  if (left + width > viewportWidth - VIEWPORT_GAP) {
    left = triggerRect.right - width;
  }
  left = Math.max(VIEWPORT_GAP, left);

  const spaceBelow = viewportHeight - triggerRect.bottom - VIEWPORT_GAP;
  const spaceAbove = triggerRect.top - VIEWPORT_GAP;
  const openUpward = spaceBelow < Math.min(POPOVER_HEIGHT, 420) && spaceAbove > spaceBelow;

  const top = openUpward
    ? Math.max(VIEWPORT_GAP, triggerRect.top - Math.min(POPOVER_HEIGHT, viewportHeight - VIEWPORT_GAP * 2) - 10)
    : Math.max(VIEWPORT_GAP, Math.min(viewportHeight - VIEWPORT_GAP - 320, triggerRect.bottom + 10));

  return { top, left, width, openUpward, compact, mounted: false };
}

export function DateRangePicker({ from, to, onApply }: DateRangePickerProps) {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState<Date | null>(() => parseDate(from));
  const [draftTo, setDraftTo] = useState<Date | null>(() => parseDate(to));
  const [monthCursor, setMonthCursor] = useState<Date>(() => startOfMonth(parseDate(from) || new Date()));
  const [position, setPosition] = useState<PopoverPosition>({
    top: 0,
    left: 0,
    width: DESKTOP_WIDTH,
    openUpward: false,
    compact: false,
    mounted: false
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setDraftFrom(parseDate(from));
    setDraftTo(parseDate(to));
    setMonthCursor(startOfMonth(parseDate(from) || new Date()));
  }, [from, to]);

  const updatePosition = () => {
    if (!triggerRef.current) return;
    setPosition(getPopoverPosition(triggerRef.current.getBoundingClientRect()));
  };

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current || !popoverRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const popoverRect = popoverRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = position.left;
    let top = position.top;

    if (left + popoverRect.width > viewportWidth - VIEWPORT_GAP) {
      left = Math.max(VIEWPORT_GAP, viewportWidth - VIEWPORT_GAP - popoverRect.width);
    }

    if (left < VIEWPORT_GAP) {
      left = VIEWPORT_GAP;
    }

    if (position.openUpward) {
      top = Math.max(VIEWPORT_GAP, triggerRect.top - popoverRect.height - 10);
    } else if (top + popoverRect.height > viewportHeight - VIEWPORT_GAP) {
      const canOpenUp = triggerRect.top - popoverRect.height - 10 >= VIEWPORT_GAP;
      top = canOpenUp
        ? triggerRect.top - popoverRect.height - 10
        : Math.max(VIEWPORT_GAP, viewportHeight - VIEWPORT_GAP - popoverRect.height);
    }

    setPosition((current) => ({
      ...current,
      top,
      left,
      openUpward: top < triggerRect.top,
      mounted: true
    }));
  }, [open, position.left, position.openUpward, position.top, position.width]);

  useEffect(() => {
    if (!open) return undefined;

    const handleOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        popoverRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
      setDraftFrom(parseDate(from));
      setDraftTo(parseDate(to));
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setDraftFrom(parseDate(from));
        setDraftTo(parseDate(to));
      }
    };

    const handleReposition = () => updatePosition();

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    const focusTimer = window.setTimeout(() => {
      popoverRef.current?.querySelector<HTMLButtonElement>("[data-preset-button='true']")?.focus();
    }, 10);

    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
      window.clearTimeout(focusTimer);
    };
  }, [from, open, to]);

  const triggerLabel = from && to ? `${formatDisplayDate(from)} - ${formatDisplayDate(to)}` : "Select date range";

  const handlePreset = (preset: PresetKey) => {
    const range = getPresetRange(preset);
    setDraftFrom(range.from);
    setDraftTo(range.to);
    setMonthCursor(startOfMonth(range.from || new Date()));
  };

  const handleSelectDate = (date: Date) => {
    if (!draftFrom || draftTo) {
      setDraftFrom(date);
      setDraftTo(null);
      return;
    }

    if (startOfDay(date).getTime() < startOfDay(draftFrom).getTime()) {
      setDraftTo(draftFrom);
      setDraftFrom(date);
      return;
    }

    setDraftTo(date);
  };

  const handleApply = () => {
    onApply({
      from: toIsoDate(draftFrom),
      to: toIsoDate(draftTo || draftFrom)
    });
    setOpen(false);
  };

  const handleCancel = () => {
    setDraftFrom(parseDate(from));
    setDraftTo(parseDate(to));
    setOpen(false);
  };

  const popover = open && mounted ? createPortal(
    <div
      className="fixed inset-0 z-[120]"
      role="presentation"
    >
      <div
        className="absolute inset-0 bg-transparent"
        role="presentation"
      />
      <div
        aria-label="Choose date range"
        className={cn(
          "absolute overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.16)] ring-1 ring-black/5",
          "transition-all duration-150 ease-out",
          position.mounted ? "opacity-100 scale-100" : "opacity-0 scale-95",
          position.openUpward ? "origin-bottom-right" : "origin-top-right"
        )}
        ref={popoverRef}
        role="dialog"
        style={{
          top: position.top,
          left: position.left,
          width: position.width,
          maxHeight: `calc(100vh - ${VIEWPORT_GAP * 2}px)`
        }}
      >
        <div className={cn("flex", position.compact ? "flex-col" : "flex-row")}>
          <div
            className={cn(
              "bg-slate-50/80",
              position.compact ? "border-b border-slate-200 px-3 py-3" : "w-[164px] border-r border-slate-200 px-3 py-3"
            )}
          >
            <div className={cn("gap-1", position.compact ? "grid grid-cols-2" : "flex flex-col")}>
              {PRESETS.map((preset) => (
                <button
                  className="rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-600 transition hover:bg-white hover:text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  data-preset-button="true"
                  key={preset.key}
                  onClick={() => handlePreset(preset.key)}
                  type="button"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div className="text-sm font-semibold text-slate-800">Date range</div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-600">
                {draftFrom ? formatDisplayDate(toIsoDate(draftFrom)) : "Start"}
                <span className="mx-2 text-slate-300">-</span>
                {draftTo ? formatDisplayDate(toIsoDate(draftTo)) : draftFrom ? formatDisplayDate(toIsoDate(draftFrom)) : "End"}
              </div>
            </div>

            <div className="overflow-auto">
              <div className={cn("flex", position.compact ? "flex-col" : "flex-row")}>
                <div className={cn(position.compact ? "" : "border-r border-slate-200")}>
                  <div className="flex items-center justify-between px-4 pt-3">
                    <Button className="h-9 w-9 rounded-lg p-0" onClick={() => setMonthCursor(addMonths(monthCursor, -1))} size="icon" variant="outline">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {position.compact ? (
                      <div className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
                        {monthCursor.toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                      </div>
                    ) : null}
                    <Button className="h-9 w-9 rounded-lg p-0" onClick={() => setMonthCursor(addMonths(monthCursor, 1))} size="icon" variant="outline">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <CalendarMonth compact={position.compact} month={monthCursor} onSelect={handleSelectDate} rangeFrom={draftFrom} rangeTo={draftTo} />
                </div>

                {!position.compact ? (
                  <div>
                    <div className="h-[45px]" />
                    <CalendarMonth month={addMonths(monthCursor, 1)} onSelect={handleSelectDate} rangeFrom={draftFrom} rangeTo={draftTo} />
                  </div>
                ) : null}
              </div>
            </div>

            <div className={cn(
              "border-t border-slate-200 bg-white px-4 py-3",
              position.compact ? "space-y-3" : "flex items-center justify-between gap-4"
            )}>
              <div className={cn("items-center gap-2", position.compact ? "grid grid-cols-[1fr_auto_1fr]" : "flex")}>
                <input
                  className="min-w-0 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-300"
                  onChange={(event) => setDraftFrom(parseDate(event.target.value))}
                  type="date"
                  value={toIsoDate(draftFrom)}
                />
                <span className="text-center text-slate-300">-</span>
                <input
                  className="min-w-0 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-300"
                  onChange={(event) => setDraftTo(parseDate(event.target.value))}
                  type="date"
                  value={toIsoDate(draftTo)}
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button className="rounded-lg px-4" onClick={handleCancel} type="button" variant="outline">
                  Cancel
                </Button>
                <Button className="rounded-lg bg-indigo-500 px-4 text-white hover:bg-indigo-500" onClick={handleApply} type="button">
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        className={cn(
          "inline-flex min-w-[280px] items-center gap-3 rounded-xl border bg-white px-4 py-3 text-left text-sm font-medium shadow-sm transition",
          "focus:outline-none focus:ring-2 focus:ring-indigo-100",
          open ? "border-indigo-400 ring-2 ring-indigo-100" : "border-slate-200 hover:border-slate-300"
        )}
        onClick={() => setOpen((current) => !current)}
        ref={triggerRef}
        type="button"
      >
        <CalendarRange className="h-4 w-4 text-slate-400" />
        <span className="truncate text-slate-700">{triggerLabel}</span>
      </button>
      {popover}
    </>
  );
}
