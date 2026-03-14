"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ChevronDown, ChevronUp, MoreHorizontal } from "lucide-react";
import { STATUS_LABELS, KANBAN_COLUMNS, type AppStatus } from "@/types";

interface AppRow {
  id: string;
  company: string;
  role: string;
  status: string;
  location: string | null;
  stack: string;
  resumeLabel: string | null;
  appliedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

function FilterSection({
  title,
  count,
  children,
  defaultOpen = true,
}: {
  title: string;
  count?: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-edge pb-3 last:border-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-2 text-left text-[13px] font-semibold text-t-primary"
      >
        <span>
          {title}
          {count !== undefined && count > 0 && (
            <span className="ml-1.5 font-normal text-t-muted">({count})</span>
          )}
        </span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && <div className="mt-1">{children}</div>}
    </div>
  );
}

const DATE_FILTER_OPTIONS = [
  { value: "", label: "All time" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
] as const;

export default function ApplicationsCardView({ applications }: { applications: AppRow[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const filtered = useMemo(() => {
    let result = applications;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.company.toLowerCase().includes(q) ||
          a.role.toLowerCase().includes(q) ||
          (a.location && a.location.toLowerCase().includes(q))
      );
    }
    if (statusFilter) result = result.filter((a) => a.status === statusFilter);
    if (dateFilter) {
      const days = parseInt(dateFilter, 10);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      cutoff.setHours(0, 0, 0, 0);
      result = result.filter((a) => new Date(a.createdAt) >= cutoff);
    }
    return result;
  }, [applications, searchQuery, statusFilter, dateFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    KANBAN_COLUMNS.forEach((s) => {
      counts[s] = applications.filter((a) => a.status === s).length;
    });
    return counts;
  }, [applications]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
    setDateFilter("");
  };

  const hasFilters = searchQuery || statusFilter || dateFilter;

  return (
    <div className="rounded-xl border border-edge bg-surface p-4 sm:p-6">
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar filters */}
        <aside className="w-full shrink-0 lg:w-56">
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Search company/role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-edge bg-bg px-3 py-2.5 text-[13px] text-t-primary placeholder:text-t-faint focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <div className="space-y-1">
              <h2 className="text-[13px] font-semibold text-t-primary">Job Filters</h2>
              <FilterSection title="Status" defaultOpen={true}>
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setStatusFilter("")}
                    className={`block w-full rounded px-2 py-1.5 text-left text-[12px] ${
                      !statusFilter ? "bg-accent/15 font-medium text-t-primary" : "text-t-muted hover:bg-edge/50"
                    }`}
                  >
                    All
                  </button>
                  {KANBAN_COLUMNS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatusFilter(s)}
                      className={`block w-full rounded px-2 py-1.5 text-left text-[12px] ${
                        statusFilter === s ? "bg-accent/15 font-medium text-t-primary" : "text-t-muted hover:bg-edge/50"
                      }`}
                    >
                      {STATUS_LABELS[s as AppStatus]} ({statusCounts[s] ?? 0})
                    </button>
                  ))}
                </div>
              </FilterSection>
              <FilterSection title="Added date" defaultOpen={true}>
                <div className="space-y-1">
                  {DATE_FILTER_OPTIONS.map((opt) => (
                    <button
                      key={opt.value || "all"}
                      type="button"
                      onClick={() => setDateFilter(opt.value)}
                      className={`block w-full rounded px-2 py-1.5 text-left text-[12px] ${
                        dateFilter === opt.value ? "bg-accent/15 font-medium text-t-primary" : "text-t-muted hover:bg-edge/50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </FilterSection>
            </div>
            {hasFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-[12px] font-medium text-accent hover:underline"
              >
                clear all filters & search
              </button>
            )}
          </div>
        </aside>

        {/* Card grid */}
        <div className="min-w-0 flex-1">
          <p className="mb-4 text-[13px] text-t-muted">
            {filtered.length} {filtered.length === 1 ? "application" : "applications"}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {filtered.map((a) => (
              <Link
                key={a.id}
                href={`/applications/${a.id}`}
                className="group flex items-start justify-between gap-3 rounded-lg border border-edge bg-bg p-4 shadow-sm transition-all hover:border-edge-hover hover:shadow-md"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="text-[15px] font-semibold text-t-primary">{a.role}</h3>
                  <p className="mt-1 text-[13px] font-medium text-t-muted">{a.company}</p>
                  <p className="mt-1 text-[12px] text-t-muted">
                    Added {format(new Date(a.createdAt), "MMM d, yyyy")}
                    {a.location && (
                      <>
                        <span className="mx-1.5">·</span>
                        {a.location}
                      </>
                    )}
                  </p>
                  <span
                    className={`mt-2 inline-block rounded px-2 py-0.5 text-[11px] font-medium ${
                      a.status === "OFFER"
                        ? "bg-[var(--status-offer-bg)] text-[var(--status-offer-text)]"
                        : a.status === "REJECTED" || a.status === "GHOSTED"
                        ? "bg-[var(--status-rejected-bg)] text-[#f87171]"
                        : a.status === "INTERVIEW"
                        ? "bg-[var(--status-interview-bg)] text-[#fbbf24]"
                        : "bg-[var(--status-applied-bg)] text-[#a78bfa]"
                    }`}
                  >
                    {STATUS_LABELS[a.status as AppStatus]}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => e.preventDefault()}
                  className="shrink-0 rounded p-1.5 text-t-faint opacity-0 transition-opacity hover:bg-edge hover:text-t-primary group-hover:opacity-100"
                  aria-label="More options"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </Link>
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="rounded-lg border border-edge bg-bg p-12 text-center">
              <p className="text-[14px] text-t-muted">
                No applications match your filters. Try adjusting your search or filters.
              </p>
              <button
                type="button"
                onClick={handleClearFilters}
                className="mt-3 text-[13px] font-medium text-accent hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
