import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Building2, CalendarRange, Filter, MapPin, ShieldCheck, User2 } from "lucide-react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import type { AdminStructureCard, SystemStats } from "@/types";

const statusTabs = ["all", "submitted", "tested", "validated", "approved", "rejected"] as const;
const structureTypeOptions = ["all", "residential", "commercial", "educational", "hospital", "industrial"] as const;

function formatStatus(value?: string) {
  if (!value) return "Draft";
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(value?: string) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

export function StructuresPage() {
  const [structures, setStructures] = useState<AdminStructureCard[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [status, setStatus] = useState<(typeof statusTabs)[number]>("all");
  const [structureType, setStructureType] = useState<(typeof structureTypeOptions)[number]>("all");
  const [query, setQuery] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(12);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let ignore = false;

    const timeoutId = window.setTimeout(() => {
      void load();
    }, 250);

    async function load() {
      try {
        setLoading(true);
        setError("");
        const [structureResponse, statsResponse] = await Promise.all([
          api.getAdminStructures({
            page,
            limit,
            status,
            type_of_structure: structureType,
            search: query,
            date_from: dateFrom,
            date_to: dateTo
          }),
          api.getSystemStats()
        ]);

        if (!ignore) {
          setStructures(structureResponse.data || []);
          setStats(statsResponse.data || null);
          setTotal(structureResponse.total || 0);
          setTotalPages(structureResponse.totalPages || 1);
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load structures");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    return () => {
      ignore = true;
      window.clearTimeout(timeoutId);
    };
  }, [dateFrom, dateTo, limit, page, query, status, structureType]);

  useEffect(() => {
    setPage(1);
  }, [dateFrom, dateTo, query, status, structureType]);

  const summaryItems = [
    { label: "Total structures", value: stats?.structures?.total ?? structures.length },
    { label: "Active users", value: stats?.users?.active ?? "" },
    { label: "Approved", value: structures.filter((item) => item.status === "approved").length },
    {
      label: "Under review",
      value: structures.filter((item) => ["submitted", "tested", "validated"].includes(item.status || "")).length
    }
  ];

  const canGoPrevious = page > 1;
  const canGoNext = page < totalPages;

  return (
    <AppShell
      action={
        <Button className="rounded-full px-5" variant="outline">
          <ShieldCheck className="h-4 w-4" />
          Verified admin
        </Button>
      }
      onSearchChange={setQuery}
      searchValue={query}
    >
      <section className="mb-6 rounded-[30px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#fbfcff_100%)] p-6">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Structure administration
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.05em] text-slate-950 md:text-5xl">
              All structures
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 md:text-base">
              Browse every structure owned by the admin workspace and open each one into a focused detail view.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {summaryItems.map((item) => (
              <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-3" key={item.label}>
                <span className="text-xs uppercase tracking-[0.16em] text-slate-400">{item.label}</span>
                <span className="ml-3 text-lg font-semibold tracking-[-0.03em] text-slate-950">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Button className="rounded-full" variant="outline">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2">
            <CalendarRange className="h-4 w-4 text-slate-400" />
            <Input
              className="h-auto w-[132px] border-0 bg-transparent p-0 text-sm shadow-none focus:border-0 focus:ring-0"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <span className="text-xs text-slate-400">to</span>
            <Input
              className="h-auto w-[132px] border-0 bg-transparent p-0 text-sm shadow-none focus:border-0 focus:ring-0"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <div className="inline-flex rounded-full border border-slate-200 bg-slate-100 p-1">
            {statusTabs.map((item) => (
              <button
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  status === item ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"
                }`}
                key={item}
                onClick={() => setStatus(item)}
                type="button"
              >
                {item === "all" ? "All" : formatStatus(item)}
              </button>
            ))}
          </div>
          <div className="inline-flex rounded-full border border-slate-200 bg-slate-100 p-1">
            {structureTypeOptions.map((item) => (
              <button
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  structureType === item ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"
                }`}
                key={item}
                onClick={() => setStructureType(item)}
                type="button"
              >
                {item === "all" ? "All Types" : formatStatus(item)}
              </button>
            ))}
          </div>
        </div>
        <p className="text-sm text-slate-500">
          Showing <span className="font-bold text-slate-900">{structures.length}</span> of{" "}
          <span className="font-bold text-slate-900">{total}</span> structure cards
        </p>
      </div>

      {loading ? (
        <div className="rounded-[28px] border border-slate-200 bg-white p-8 text-sm text-slate-500">Loading structures...</div>
      ) : error ? (
        <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-8 text-sm font-medium text-rose-600">{error}</div>
      ) : structures.length === 0 ? (
        <div className="rounded-[28px] border border-slate-200 bg-white p-10 text-center">
          <Building2 className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="mt-4 text-2xl font-black tracking-[-0.04em] text-slate-950">No structures found</h3>
          <p className="mt-2 text-sm text-slate-500">Try changing the search or filter selection.</p>
        </div>
      ) : (
        <>
        <div className="grid gap-4">
          {structures.map((structure, index) => {
            const ratingSummary = structure.ratings_summary;

            return (
              <motion.div
              animate={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              key={structure.structure_id}
              transition={{ duration: 0.35, delay: index * 0.04 }}
            >
              <Link to={`/structures/${structure.structure_id}`}>
                <Card className="overflow-hidden rounded-[30px] border-slate-200/70 transition duration-200 hover:-translate-y-1 hover:shadow-soft">
                  <CardContent className="grid gap-5 p-4 lg:grid-cols-[220px_minmax(0,1fr)]">
                    <div className="relative overflow-hidden rounded-[24px] bg-[linear-gradient(145deg,#eef2ff_0%,#c7d2fe_48%,#1e293b_100%)]">
                      <div className="absolute left-4 top-4 z-10">
                        <Badge tone={structure.status}>{formatStatus(structure.status)}</Badge>
                      </div>
                      <div className="flex min-h-[220px] flex-col justify-end bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.65),transparent_24%),linear-gradient(180deg,transparent,rgba(15,23,42,0.22))] p-4">
                        <div className="rounded-[20px] border border-white/40 bg-white/15 p-3 backdrop-blur">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-white/70">Structure</p>
                          <p className="mt-2 text-lg font-semibold text-white">
                            {structure.structure_number || structure.uid || "Pending identity"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="mb-2 flex flex-wrap gap-2">
                            <Badge>{structure.type || "Structure"}</Badge>
                            {structure.uid ? <Badge>{structure.uid}</Badge> : null}
                          </div>
                          <h2 className="text-3xl font-semibold tracking-[-0.05em] text-slate-950">
                            {structure.structure_number || structure.structure_name || "Unnamed Structure"}
                          </h2>
                          <p className="mt-2 text-base text-slate-500">
                            {structure.client_name || "No client name"} | {structure.location?.city || "Unknown city"},{" "}
                            {structure.location?.state || "Unknown state"}
                          </p>
                        </div>
                        <div className="text-left lg:text-right">
                          <div className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                            {formatDate(structure.last_updated || structure.created_date)}
                          </div>
                          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">Last updated</p>
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-3">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Owner</p>
                          <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
                            <User2 className="h-4 w-4 text-slate-400" />
                            {structure.owner?.username || structure.owner?.email || "Unknown owner"}
                          </div>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Location</p>
                          <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
                            <MapPin className="h-4 w-4 text-slate-400" />
                            {structure.location?.city || "Unknown city"}
                          </div>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Type</p>
                          <div className="mt-2 text-sm font-semibold text-slate-800">{structure.type || "Not set"}</div>
                        </div>
                      </div>

                      <div className="grid gap-4 border-t border-slate-200 pt-4 md:grid-cols-4">
                        <div>
                          <p className="text-2xl font-semibold tracking-[-0.05em] text-slate-950">
                            {ratingSummary?.completion_percentage ?? 0}%
                          </p>
                          <p className="text-xs text-slate-500">Rating completion</p>
                        </div>
                        <div>
                          <p className="text-2xl font-semibold tracking-[-0.05em] text-slate-950">
                            {ratingSummary?.avg_structural_rating ?? "-"}
                          </p>
                          <p className="text-xs text-slate-500">Structural rating</p>
                        </div>
                        <div>
                          <p className="text-2xl font-semibold tracking-[-0.05em] text-slate-950">
                            {ratingSummary?.overall_health || "Unrated"}
                          </p>
                          <p className="text-xs text-slate-500">Health status</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-2xl font-semibold tracking-[-0.05em] text-slate-950">Open</p>
                            <p className="text-xs text-slate-500">View details</p>
                          </div>
                          <ArrowRight className="h-5 w-5 text-slate-400" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              </motion.div>
            );
          })}
        </div>
        <div className="mt-5 flex flex-col gap-3 rounded-[24px] border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Page <span className="font-semibold text-slate-900">{page}</span> of{" "}
            <span className="font-semibold text-slate-900">{totalPages}</span>
          </p>
          <div className="flex items-center gap-2">
            <Button
              className="rounded-full px-4"
              disabled={!canGoPrevious}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              variant="outline"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              className="rounded-full px-4"
              disabled={!canGoNext}
              onClick={() => setPage((current) => current + 1)}
              variant="outline"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        </>
      )}
    </AppShell>
  );
}
