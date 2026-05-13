import { useEffect, useMemo, useRef, useState } from "react";
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

const WEEK_DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

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
  onSelect
}: {
  month: Date;
  rangeFrom: Date | null;
  rangeTo: Date | null;
  onSelect: (date: Date) => void;
}) {
  const days = useMemo(() => buildCalendarDays(month), [month]);

  return (
    <div className="min-w-[280px] px-5 py-4">
      <div className="mb-4 text-center text-lg font-semibold tracking-[-0.03em] text-slate-800">
        {month.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
      </div>
      <div className="mb-3 grid grid-cols-7 gap-y-2 text-center text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
        {WEEK_DAYS.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-2 text-center">
        {days.map((day) => {
          const isCurrentMonth = day.getMonth() === month.getMonth();
          const isStart = isSameDay(day, rangeFrom);
          const isEnd = isSameDay(day, rangeTo);
          const inRange = isBetween(day, rangeFrom, rangeTo);

          return (
            <div className="flex justify-center" key={`${month.toISOString()}-${day.toISOString()}`}>
              <button
                className={cn(
                  "relative flex h-10 w-10 items-center justify-center rounded-xl text-sm transition",
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

export function DateRangePicker({ from, to, onApply }: DateRangePickerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState<Date | null>(() => parseDate(from));
  const [draftTo, setDraftTo] = useState<Date | null>(() => parseDate(to));
  const [monthCursor, setMonthCursor] = useState<Date>(() => startOfMonth(parseDate(from) || new Date()));

  useEffect(() => {
    setDraftFrom(parseDate(from));
    setDraftTo(parseDate(to));
    setMonthCursor(startOfMonth(parseDate(from) || new Date()));
  }, [from, to]);

  useEffect(() => {
    if (!open) return undefined;

    const handleOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setDraftFrom(parseDate(from));
        setDraftTo(parseDate(to));
      }
    };

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [from, open, to]);

  const triggerLabel = from && to ? `${formatDisplayDate(from)} - ${formatDisplayDate(to)}` : "Select date range";

  const handlePreset = (preset: PresetKey) => {
    const range = getPresetRange(preset);
    setDraftFrom(range.from);
    setDraftTo(range.to);
    setMonthCursor(startOfMonth(range.from || new Date()));
  };

  const handleSelectDate = (date: Date) => {
    if (!draftFrom || (draftFrom && draftTo)) {
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

  return (
    <div className="relative" ref={containerRef}>
      <button
        className={cn(
          "inline-flex min-w-[280px] items-center gap-3 rounded-xl border bg-white px-4 py-3 text-left text-sm font-medium shadow-sm transition",
          open ? "border-indigo-400 ring-2 ring-indigo-100" : "border-slate-200 hover:border-slate-300"
        )}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <CalendarRange className="h-4 w-4 text-slate-400" />
        <span className="text-slate-700">{triggerLabel}</span>
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+12px)] z-30 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.16)]">
          <div className="flex min-w-[980px]">
            <div className="w-[190px] border-r border-slate-200 bg-slate-50/70 px-4 py-4">
              <div className="space-y-1">
                {PRESETS.map((preset) => (
                  <button
                    className="flex w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-white hover:text-slate-900"
                    key={preset.key}
                    onClick={() => handlePreset(preset.key)}
                    type="button"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-500">
                  Date range
                </div>
                <div className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
                  {draftFrom ? formatDisplayDate(toIsoDate(draftFrom)) : "Start"}{" "}
                  <span className="mx-1 text-slate-300">-</span>{" "}
                  {draftTo ? formatDisplayDate(toIsoDate(draftTo)) : draftFrom ? formatDisplayDate(toIsoDate(draftFrom)) : "End"}
                </div>
              </div>

              <div className="flex">
                <div className="border-r border-slate-200">
                  <div className="flex items-center justify-between px-5 pt-4">
                    <Button className="h-10 w-10 rounded-xl p-0" onClick={() => setMonthCursor(addMonths(monthCursor, -1))} size="icon" variant="outline">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span />
                    <Button className="h-10 w-10 rounded-xl p-0" onClick={() => setMonthCursor(addMonths(monthCursor, 1))} size="icon" variant="outline">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <CalendarMonth month={monthCursor} onSelect={handleSelectDate} rangeFrom={draftFrom} rangeTo={draftTo} />
                </div>

                <div>
                  <div className="flex items-center justify-between px-5 pt-4">
                    <Button className="h-10 w-10 rounded-xl p-0 opacity-0" size="icon" variant="outline">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span />
                    <Button className="h-10 w-10 rounded-xl p-0 opacity-0" size="icon" variant="outline">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <CalendarMonth month={addMonths(monthCursor, 1)} onSelect={handleSelectDate} rangeFrom={draftFrom} rangeTo={draftTo} />
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4">
                <div className="flex items-center gap-3">
                  <input
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none ring-0 focus:border-slate-300"
                    onChange={(event) => setDraftFrom(parseDate(event.target.value))}
                    type="date"
                    value={toIsoDate(draftFrom)}
                  />
                  <span className="text-slate-300">-</span>
                  <input
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none ring-0 focus:border-slate-300"
                    onChange={(event) => setDraftTo(parseDate(event.target.value))}
                    type="date"
                    value={toIsoDate(draftTo)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button className="rounded-xl px-4" onClick={handleCancel} type="button" variant="outline">
                    Cancel
                  </Button>
                  <Button className="rounded-xl bg-indigo-500 px-4 text-white hover:bg-indigo-500" onClick={handleApply} type="button">
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
