interface StatsBarProps {
  total: number;
  active: number;
  interviews: number;
  offers: number;
  rejectionRate: number;
  streak?: number;
}

export default function StatsBar({ total, active, interviews, offers, rejectionRate, streak = 0 }: StatsBarProps) {
  const items = [
    ...(streak > 0
      ? [{ label: `${streak === 1 ? "day" : "days"} streak`, value: String(streak), colorVar: "--dash-stat-streak" as const }]
      : []),
    { label: "Applied", value: total, colorVar: "--dash-stat-applied" as const },
    { label: "Active", value: active, colorVar: "--dash-stat-applied" as const },
    { label: "Interviews", value: interviews, colorVar: "--dash-stat-interview" as const },
    { label: "Offers", value: offers, colorVar: "--dash-stat-offer" as const },
    { label: "Rejected", value: `${rejectionRate}%`, colorVar: "--dash-stat-rejected" as const },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-3">
      {items.map((s, i) => (
        <div
          key={s.label}
          className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 transition-theme hover:-translate-y-0.5 sm:min-w-[110px] sm:flex-1 sm:gap-3 sm:px-4 sm:py-3 ${
            i >= 3 ? "col-span-3 sm:col-span-1" : ""
          }`}
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
