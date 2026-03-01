interface StatsBarProps {
  total: number;
  active: number;
  interviews: number;
  offers: number;
  rejectionRate: number;
}

export default function StatsBar({ total, active, interviews, offers, rejectionRate }: StatsBarProps) {
  const items = [
    { label: "Applied", value: total, color: "text-accent" },
    { label: "Active", value: active, color: "text-accent" },
    { label: "Interviews", value: interviews, color: "text-[#a78bfa]" },
    { label: "Offers", value: offers, color: "text-[#fb923c]" },
    { label: "Rejected", value: `${rejectionRate}%`, color: "text-[#f87171]" },
  ];

  return (
    <div className="flex gap-3 overflow-x-auto">
      {items.map((s) => (
        <div
          key={s.label}
          className="flex min-w-[110px] flex-1 items-center gap-3 border border-edge bg-surface px-4 py-3 transition-theme hover:-translate-y-px hover:border-edge-hover"
        >
          <span className={`text-[36px] font-medium leading-none ${s.color}`}>{s.value}</span>
          <span className="text-[13px] font-light text-t-muted">{s.label}</span>
        </div>
      ))}
    </div>
  );
}
