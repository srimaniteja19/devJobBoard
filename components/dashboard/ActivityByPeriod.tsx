"use client";

import { STATUS_LABELS, KANBAN_COLUMNS, type AppStatus } from "@/types";

const STATUS_COLOR_VAR: Record<AppStatus, string> = {
  WISHLIST: "var(--dash-status-wishlist)",
  APPLIED: "var(--dash-stat-applied)",
  SCREENING: "var(--dash-status-screening)",
  INTERVIEW: "var(--dash-stat-interview)",
  OFFER: "var(--dash-stat-offer)",
  REJECTED: "var(--dash-stat-rejected)",
  GHOSTED: "var(--dash-status-ghosted)",
};

export type ActivityByPeriodData = Record<string, { today: number; week: number; month: number }>;

interface ActivityByPeriodProps {
  data: ActivityByPeriodData;
}

export default function ActivityByPeriod({ data }: ActivityByPeriodProps) {
  const statuses = KANBAN_COLUMNS;
  const hasAny = statuses.some(
    (s) => (data[s]?.today ?? 0) > 0 || (data[s]?.week ?? 0) > 0 || (data[s]?.month ?? 0) > 0
  );
  if (!hasAny) return null;

  return (
    <div
      className="mt-4 overflow-hidden rounded-xl border sm:mt-5"
      style={{
        backgroundColor: "var(--dash-card-bg)",
        borderColor: "var(--dash-card-border)",
      }}
    >
      <div className="border-b px-3 py-2 sm:px-4 sm:py-2.5" style={{ borderColor: "var(--dash-card-border)" }}>
        <h3 className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--dash-column-text)" }}>
          Activity
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[12px] sm:text-[13px]">
          <thead>
            <tr style={{ borderColor: "var(--dash-card-border)" }} className="border-b">
              <th className="px-3 py-2 text-left font-medium sm:px-4" style={{ color: "var(--dash-card-role)" }}>
                Status
              </th>
              <th className="px-3 py-2 text-center font-medium sm:px-4" style={{ color: "var(--dash-column-text)" }}>
                Today
              </th>
              <th className="px-3 py-2 text-center font-medium sm:px-4" style={{ color: "var(--dash-column-text)" }}>
                This week
              </th>
              <th className="px-3 py-2 text-center font-medium sm:px-4" style={{ color: "var(--dash-column-text)" }}>
                This month
              </th>
            </tr>
          </thead>
          <tbody>
            {statuses.map((status) => {
              const row = data[status];
              const t = row?.today ?? 0;
              const w = row?.week ?? 0;
              const m = row?.month ?? 0;
              return (
                <tr
                  key={status}
                  style={{ borderColor: "var(--dash-card-border)" }}
                  className="border-b last:border-b-0"
                >
                  <td className="px-3 py-1.5 sm:px-4 sm:py-2">
                    <span className="font-medium" style={{ color: STATUS_COLOR_VAR[status] }}>
                      {STATUS_LABELS[status]}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 text-center sm:px-4 sm:py-2" style={{ color: "var(--dash-card-company)" }}>
                    {t}
                  </td>
                  <td className="px-3 py-1.5 text-center sm:px-4 sm:py-2" style={{ color: "var(--dash-card-company)" }}>
                    {w}
                  </td>
                  <td className="px-3 py-1.5 text-center sm:px-4 sm:py-2" style={{ color: "var(--dash-card-company)" }}>
                    {m}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
