"use client";

import { STATUS_LABELS, KANBAN_COLUMNS, type AppStatus } from "@/types";
import {
  Bookmark,
  Send,
  Search,
  Video,
  Trophy,
  XCircle,
  Ghost,
  Calendar,
} from "lucide-react";

export type ActivityByPeriodData = Record<string, { today: number; week: number; month: number }>;

const STATUS_ICONS: Record<AppStatus, React.ReactNode> = {
  WISHLIST: <Bookmark className="h-5 w-5" />,
  APPLIED: <Send className="h-5 w-5" />,
  SCREENING: <Search className="h-5 w-5" />,
  INTERVIEW: <Video className="h-5 w-5" />,
  OFFER: <Trophy className="h-5 w-5" />,
  REJECTED: <XCircle className="h-5 w-5" />,
  GHOSTED: <Ghost className="h-5 w-5" />,
};

const CARD_GRADIENTS: Record<AppStatus, string> = {
  WISHLIST: "from-slate-100 via-white to-slate-50",
  APPLIED: "from-indigo-50 via-white to-violet-50",
  SCREENING: "from-amber-50 via-white to-yellow-50",
  INTERVIEW: "from-sky-50 via-white to-blue-50",
  OFFER: "from-emerald-50 via-white to-teal-50",
  REJECTED: "from-rose-50 via-white to-red-50",
  GHOSTED: "from-stone-100 via-white to-zinc-50",
};

const CARD_BORDERS: Record<AppStatus, string> = {
  WISHLIST: "border-slate-200/60",
  APPLIED: "border-indigo-200/60",
  SCREENING: "border-amber-200/60",
  INTERVIEW: "border-sky-200/60",
  OFFER: "border-emerald-200/60",
  REJECTED: "border-rose-200/60",
  GHOSTED: "border-stone-200/60",
};

const STATUS_COLOR: Record<AppStatus, string> = {
  WISHLIST: "text-slate-600",
  APPLIED: "text-indigo-600",
  SCREENING: "text-amber-600",
  INTERVIEW: "text-sky-600",
  OFFER: "text-emerald-600",
  REJECTED: "text-rose-600",
  GHOSTED: "text-stone-500",
};

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
    <section className="mt-8 sm:mt-10">
      <div className="mb-4 flex items-center gap-2">
        <Calendar className="h-4 w-4" style={{ color: "var(--dash-column-text)" }} />
        <h2 className="text-[13px] font-semibold uppercase tracking-wider" style={{ color: "var(--dash-column-text)" }}>
          Activity
        </h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {statuses.map((status) => {
          const row = data[status];
          const today = row?.today ?? 0;
          const week = row?.week ?? 0;
          const month = row?.month ?? 0;
          const total = today + week + month;
          if (total === 0) return null;

          return (
            <div
              key={status}
              className={`group overflow-hidden rounded-2xl border shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${CARD_GRADIENTS[status]} ${CARD_BORDERS[status]}`}
            >
              <div className="flex items-start justify-between p-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/90 shadow-sm ${STATUS_COLOR[status]}`}
                  >
                    {STATUS_ICONS[status]}
                  </div>
                  <div>
                    <p className={`text-[14px] font-semibold ${STATUS_COLOR[status]}`}>
                      {STATUS_LABELS[status]}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">Today · Week · Month</p>
                  </div>
                </div>
              </div>
              <div className="flex border-t border-black/5 bg-white/50 px-4 py-3">
                <div className="flex flex-1 justify-around gap-1 text-center">
                  <div>
                    <p className="text-[18px] font-bold" style={{ color: "var(--dash-card-company)" }}>
                      {today}
                    </p>
                    <p className="text-[10px] font-medium" style={{ color: "var(--dash-column-text)" }}>Today</p>
                  </div>
                  <div>
                    <p className="text-[18px] font-bold" style={{ color: "var(--dash-card-company)" }}>
                      {week}
                    </p>
                    <p className="text-[10px] font-medium" style={{ color: "var(--dash-column-text)" }}>Week</p>
                  </div>
                  <div>
                    <p className="text-[18px] font-bold" style={{ color: "var(--dash-card-company)" }}>
                      {month}
                    </p>
                    <p className="text-[10px] font-medium" style={{ color: "var(--dash-column-text)" }}>Month</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
