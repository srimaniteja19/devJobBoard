"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowUpDown, Search } from "lucide-react";
import StatusSelect from "./StatusSelect";
import { STATUS_LABELS, KANBAN_COLUMNS, type AppStatus } from "@/types";
import { parseStack, getTagColor } from "@/lib/utils";

interface AppRow {
  id: string;
  company: string;
  role: string;
  status: string;
  location: string | null;
  stack: string;
  resumeLabel: string | null;
  appliedAt: string | null;
  updatedAt: string;
}

type SortKey = "company" | "role" | "status" | "appliedAt" | "updatedAt";

export default function ApplicationsTable({ applications }: { applications: AppRow[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("updatedAt");
  const [sortAsc, setSortAsc] = useState(false);

  const filtered = useMemo(() => {
    let result = applications;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) => a.company.toLowerCase().includes(q) || a.role.toLowerCase().includes(q)
      );
    }

    if (statusFilter) result = result.filter((a) => a.status === statusFilter);

    return [...result].sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [applications, search, statusFilter, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 sm:max-w-xs">
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
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-edge text-left">
              <SortTh label="Company" k="company" cur={sortKey} asc={sortAsc} onClick={toggleSort} />
              <SortTh label="Role" k="role" cur={sortKey} asc={sortAsc} onClick={toggleSort} />
              <th className="px-3 py-2.5 text-[11px] font-medium uppercase tracking-widest text-t-faint">Status</th>
              <th className="px-3 py-2.5 text-[11px] font-medium uppercase tracking-widest text-t-faint">Resume</th>
              <th className="px-3 py-2.5 text-[11px] font-medium uppercase tracking-widest text-t-faint">Stack</th>
              <SortTh label="Applied" k="appliedAt" cur={sortKey} asc={sortAsc} onClick={toggleSort} />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-12 text-center text-[13px] text-t-faint">
                  No applications found
                </td>
              </tr>
            ) : (
              filtered.map((a) => (
                <tr key={a.id} className="border-b border-[#0f0f0f] transition-theme hover:bg-surface">
                  <td className="px-3 py-3">
                    <Link href={`/applications/${a.id}`} className="font-medium text-t-primary transition-theme hover:text-accent">
                      {a.company}
                    </Link>
                  </td>
                  <td className="px-3 py-3 font-light text-[#999]">{a.role}</td>
                  <td className="px-3 py-3">
                    <StatusSelect applicationId={a.id} currentStatus={a.status as AppStatus} />
                  </td>
                  <td className="px-3 py-3">
                    {a.resumeLabel ? (
                      <span className="bg-edge px-1.5 py-0.5 text-[10px] font-medium text-t-muted">
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
                    {a.appliedAt ? format(new Date(a.appliedAt), "MMM d") : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
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
