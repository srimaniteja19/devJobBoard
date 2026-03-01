"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import { STATUS_COLORS, type AppStatus } from "@/types";

interface Activity {
  id: string;
  action: string;
  createdAt: string;
  company: string;
  role: string;
  status: string;
  applicationId: string;
}

type Filter = "all" | "week" | "month";

export default function ActivityFeed({ activities }: { activities: Activity[] }) {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    const now = Date.now();
    return activities.filter((a) => {
      if (filter === "all") return true;
      const age = now - new Date(a.createdAt).getTime();
      if (filter === "week") return age <= 7 * 86400000;
      return age <= 30 * 86400000;
    });
  }, [activities, filter]);

  const filters: { value: Filter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
  ];

  return (
    <div>
      <div className="mb-4 flex gap-1">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 text-[12px] font-light transition-theme ${
              filter === f.value
                ? "bg-surface text-t-primary border border-edge"
                : "text-t-muted hover:text-t-primary"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-[13px] text-t-faint">No activity yet</p>
      ) : (
        <div className="space-y-0">
          {filtered.map((a) => (
            <div key={a.id} className="flex gap-3 border-b border-[#0f0f0f] py-3">
              <div className="mt-1.5 flex flex-col items-center">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: getStatusDotColor(a.status) }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/applications/${a.applicationId}`}
                  className="text-[13px] font-medium text-t-primary transition-theme hover:text-accent"
                >
                  {a.company} · {a.role}
                </Link>
                <p className="text-[12px] font-light text-t-muted">{a.action}</p>
                <p className="mt-0.5 text-[11px] font-light text-t-faint">
                  {formatDistanceToNowStrict(new Date(a.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getStatusDotColor(status: string): string {
  const map: Record<string, string> = {
    WISHLIST: "#555555",
    APPLIED: "#a78bfa",
    SCREENING: "#fbbf24",
    INTERVIEW: "#fb923c",
    OFFER: "#e8ff47",
    REJECTED: "#f87171",
    GHOSTED: "#444444",
  };
  return map[status] ?? "#555555";
}
