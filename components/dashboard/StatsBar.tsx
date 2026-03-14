export type MetricId = "streak" | "applied" | "active" | "interviews" | "offers" | "rejected";

interface StatsBarProps {
  total: number;
  active: number;
  interviews: number;
  offers: number;
  rejectionRate: number;
  streak?: number;
  visibleMetrics?: MetricId[];
}

export default function StatsBar({
  total,
  active,
  interviews,
  offers,
  rejectionRate,
  streak = 0,
  visibleMetrics = ["streak", "applied", "active", "interviews", "offers", "rejected"],
}: StatsBarProps) {
  const allItems = [
    { id: "streak" as const, label: `${streak === 1 ? "day" : "days"} streak`, value: String(streak), colorVar: "--dash-stat-streak" as const },
    { id: "applied" as const, label: "Applied", value: total, colorVar: "--dash-stat-applied" as const },
    { id: "active" as const, label: "Active", value: active, colorVar: "--dash-stat-applied" as const },
    { id: "interviews" as const, label: "Interviews", value: interviews, colorVar: "--dash-stat-interview" as const },
    { id: "offers" as const, label: "Offers", value: offers, colorVar: "--dash-stat-offer" as const },
    { id: "rejected" as const, label: "Rejected", value: `${rejectionRate}%`, colorVar: "--dash-stat-rejected" as const },
  ];
  const items = allItems.filter((i) => visibleMetrics.includes(i.id));
  const displayItems = items.length > 0 ? items : allItems;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:flex md:flex-wrap md:gap-3">
      {displayItems.map((s, i) => (
        <div
          key={s.label}
          className="flex flex-col justify-center gap-0.5 rounded-xl border px-3 py-2.5 transition-theme hover:-translate-y-0.5 md:min-w-[100px] md:flex-1 md:max-w-[140px] md:px-4 md:py-3"
          style={{
            backgroundColor: "var(--dash-card-bg)",
            borderColor: "var(--dash-card-border)",
          }}
        >
          <span className="text-[24px] font-semibold leading-none sm:text-[36px]" style={{ color: `var(${s.colorVar})` }}>
            {s.value}
          </span>
          <span className="text-[11px] font-medium sm:text-[13px]" style={{ color: "var(--dash-column-text)" }}>
            {s.label}
          </span>
        </div>
      ))}
    </div>
  );
}
