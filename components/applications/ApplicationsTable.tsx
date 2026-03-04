"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowUpDown, Search, Trash2 } from "lucide-react";
import StatusSelect from "./StatusSelect";
import { STATUS_LABELS, STATUS_COLORS, KANBAN_COLUMNS, type AppStatus } from "@/types";
import { parseStack, getTagColor } from "@/lib/utils";
import { useToast } from "@/components/providers/ToastProvider";

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

type SortKey = "company" | "role" | "status" | "appliedAt" | "createdAt" | "updatedAt";

export default function ApplicationsTable({ applications }: { applications: AppRow[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("updatedAt");
  const [sortAsc, setSortAsc] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const filtered = useMemo(() => {
    let result = applications;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) => a.company.toLowerCase().includes(q) || a.role.toLowerCase().includes(q)
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

    return [...result].sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [applications, search, statusFilter, dateFilter, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((a) => a.id)));
  };

  const bulkMove = async () => {
    if (!bulkStatus || selected.size === 0) return;
    setBulkLoading(true);
    try {
      const res = await fetch("/api/applications/bulk-update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected), status: bulkStatus }),
      });
      if (res.ok) {
        toast(`${selected.size} moved to ${STATUS_LABELS[bulkStatus as AppStatus]}`);
        setSelected(new Set());
        setBulkStatus("");
        router.refresh();
      }
    } catch {} finally { setBulkLoading(false); }
  };

  const bulkDelete = async () => {
    if (selected.size === 0) return;
    setBulkLoading(true);
    try {
      const res = await fetch("/api/applications/bulk-update", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      if (res.ok) {
        toast(`${selected.size} deleted`);
        setSelected(new Set());
        setConfirmDelete(false);
        router.refresh();
      }
    } catch {} finally { setBulkLoading(false); }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-t-faint" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-edge bg-surface py-2 pl-9 pr-3 text-[13px] text-t-primary placeholder:text-t-faint focus:border-accent focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-edge bg-surface px-3 py-2 text-[13px] text-t-muted focus:border-accent focus:outline-none"
        >
          <option value="">All</option>
          {KANBAN_COLUMNS.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="border border-edge bg-surface px-3 py-2 text-[13px] text-t-muted focus:border-accent focus:outline-none"
        >
          <option value="">All time</option>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      {/* Mobile card list */}
      <div className="space-y-2 sm:hidden">
        {filtered.length === 0 ? (
          <p className="py-12 text-center text-[13px] text-t-faint">No applications found</p>
        ) : (
          filtered.map((a) => (
            <Link
              key={a.id}
              href={`/applications/${a.id}`}
              className="block border border-edge bg-surface p-3 transition-theme active:bg-bg"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-t-primary">{a.company}</p>
                  <p className="truncate text-[12px] font-light text-[#777]">{a.role}</p>
                </div>
                <span className={`shrink-0 text-[12px] font-medium ${STATUS_COLORS[a.status as AppStatus]}`}>
                  {STATUS_LABELS[a.status as AppStatus]}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {a.resumeLabel && (
                  <span className="border border-edge bg-[#1a1a1a] px-1.5 py-0.5 text-[10px] font-medium text-t-muted">{a.resumeLabel}</span>
                )}
                {parseStack(a.stack).slice(0, 2).map((t) => (
                  <span key={t} className={`px-1.5 py-0.5 text-[10px] font-medium ${getTagColor(t)}`}>{t}</span>
                ))}
                <span className="ml-auto text-[10px] font-light text-t-faint">
                  {format(new Date(a.createdAt), "MMM d")}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-edge text-left">
              <th className="w-10 px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={filtered.length > 0 && selected.size === filtered.length}
                  onChange={toggleAll}
                  className="accent-accent"
                />
              </th>
              <SortTh label="Company" k="company" cur={sortKey} asc={sortAsc} onClick={toggleSort} />
              <SortTh label="Role" k="role" cur={sortKey} asc={sortAsc} onClick={toggleSort} />
              <th className="px-3 py-2.5 text-[11px] font-medium uppercase tracking-widest text-t-faint">Status</th>
              <th className="px-3 py-2.5 text-[11px] font-medium uppercase tracking-widest text-t-faint">Resume</th>
              <th className="px-3 py-2.5 text-[11px] font-medium uppercase tracking-widest text-t-faint">Stack</th>
              <SortTh label="Added" k="createdAt" cur={sortKey} asc={sortAsc} onClick={toggleSort} />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-12 text-center text-[13px] text-t-faint">
                  No applications found
                </td>
              </tr>
            ) : (
              filtered.map((a) => (
                <tr key={a.id} className={`border-b border-[#0f0f0f] transition-theme hover:bg-surface ${selected.has(a.id) ? "bg-surface/50" : ""}`}>
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(a.id)}
                      onChange={() => toggleOne(a.id)}
                      className="accent-accent"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <Link href={`/applications/${a.id}`} className="font-medium text-t-primary transition-theme hover:text-accent">
                      {a.company}
                    </Link>
                  </td>
                  <td className="px-3 py-3 font-light text-[#999]">{a.role}</td>
                  <td className="px-3 py-3">
                    <StatusSelect applicationId={a.id} currentStatus={a.status as AppStatus} company={a.company} />
                  </td>
                  <td className="px-3 py-3">
                    {a.resumeLabel ? (
                      <span className="border border-edge bg-[#1a1a1a] px-1.5 py-0.5 text-[10px] font-medium text-t-muted">
                        {a.resumeLabel}
                      </span>
                    ) : (
                      <span className="text-t-faint">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex gap-1">
                      {parseStack(a.stack).slice(0, 3).map((t) => (
                        <span key={t} className={`px-1.5 py-0.5 text-[10px] font-medium ${getTagColor(t)}`}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-3 font-light text-t-faint">
                    {format(new Date(a.createdAt), "MMM d, yyyy")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 border border-edge bg-surface px-4 py-3 sm:bottom-6">
          <div className="flex items-center gap-3">
            <span className="text-[13px] font-medium text-t-primary">{selected.size} selected</span>
            <span className="h-4 w-px bg-edge" />
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="border border-edge bg-bg px-2 py-1 text-[12px] text-t-muted focus:border-accent focus:outline-none"
            >
              <option value="">Move to…</option>
              {KANBAN_COLUMNS.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
            <button
              onClick={bulkMove}
              disabled={!bulkStatus || bulkLoading}
              className="bg-accent px-3 py-1 text-[12px] font-medium text-bg transition-theme hover:bg-accent-hover disabled:opacity-40"
            >
              Apply
            </button>
            <span className="h-4 w-px bg-edge" />
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[#f87171]">Confirm?</span>
                <button
                  onClick={bulkDelete}
                  disabled={bulkLoading}
                  className="bg-[#f87171] px-2 py-1 text-[11px] font-medium text-bg"
                >
                  Yes
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-2 py-1 text-[11px] text-t-muted"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1 text-[12px] text-[#f87171] transition-theme hover:text-[#ff9999]"
              >
                <Trash2 className="h-3 w-3" /> Delete
              </button>
            )}
            <button
              onClick={() => { setSelected(new Set()); setConfirmDelete(false); }}
              className="ml-1 text-[11px] text-t-muted transition-theme hover:text-t-primary"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SortTh({ label, k, cur, asc, onClick }: {
  label: string; k: SortKey; cur: SortKey; asc: boolean; onClick: (k: SortKey) => void;
}) {
  return (
    <th
      className="cursor-pointer px-3 py-2.5 text-[11px] font-medium uppercase tracking-widest text-t-faint transition-theme hover:text-t-muted"
      onClick={() => onClick(k)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown className={`h-3 w-3 ${cur === k ? "text-t-muted" : "text-t-faint"}`} />
      </span>
    </th>
  );
}
