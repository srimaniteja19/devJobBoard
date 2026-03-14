"use client";

import { useState } from "react";
import { Settings2 } from "lucide-react";
import StatsBar from "./StatsBar";
import type { MetricId } from "./DashboardPreferences";

const METRIC_OPTIONS: { id: MetricId; label: string }[] = [
  { id: "streak", label: "Streak" },
  { id: "applied", label: "Applied" },
  { id: "active", label: "Active" },
  { id: "interviews", label: "Interviews" },
  { id: "offers", label: "Offers" },
  { id: "rejected", label: "Rejected" },
];

interface StatsBarWithSettingsProps {
  total: number;
  active: number;
  interviews: number;
  offers: number;
  rejectionRate: number;
  streak: number;
  visibleMetrics: MetricId[];
  onMetricsChange: (m: MetricId[]) => void;
}

export default function StatsBarWithSettings({
  total,
  active,
  interviews,
  offers,
  rejectionRate,
  streak,
  visibleMetrics,
  onMetricsChange,
}: StatsBarWithSettingsProps) {
  const [open, setOpen] = useState(false);

  const toggle = (id: MetricId) => {
    const next = visibleMetrics.includes(id)
      ? visibleMetrics.filter((m) => m !== id)
      : [...visibleMetrics, id];
    onMetricsChange(next.length ? next : visibleMetrics);
  };

  return (
    <div className="relative">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <StatsBar
          total={total}
          active={active}
          interviews={interviews}
          offers={offers}
          rejectionRate={rejectionRate}
          streak={streak}
          visibleMetrics={visibleMetrics}
          />
        </div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="shrink-0 self-start rounded-lg p-2 transition-colors hover:bg-black/5"
          style={{ color: "var(--dash-column-text)" }}
          title="Customize metrics"
        >
          <Settings2 className="h-4 w-4" />
        </button>
      </div>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border py-2 shadow-lg"
            style={{ backgroundColor: "var(--dash-card-bg)", borderColor: "var(--dash-card-border)" }}
          >
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--dash-column-text)" }}>
              Show metrics
            </p>
            {METRIC_OPTIONS.map((m) => (
              <label
                key={m.id}
                className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-[13px] hover:bg-black/5"
                style={{ color: "var(--dash-card-company)" }}
              >
                <input
                  type="checkbox"
                  checked={visibleMetrics.includes(m.id)}
                  onChange={() => toggle(m.id)}
                  className="h-3.5 w-3.5 rounded border-gray-300"
                />
                {m.label}
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
