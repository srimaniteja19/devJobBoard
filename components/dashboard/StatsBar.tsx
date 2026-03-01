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
    <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-3">
      {items.map((s, i) => (
        <div
          key={s.label}
          className={`flex items-center gap-2 border border-edge bg-surface px-3 py-2.5 transition-theme hover:-translate-y-px hover:border-edge-hover sm:min-w-[110px] sm:flex-1 sm:gap-3 sm:px-4 sm:py-3 ${
            i >= 3 ? "col-span-3 sm:col-span-1" : ""
          }`}
        >
          <span className={`text-[24px] font-medium leading-none sm:text-[36px] ${s.color}`}>{s.value}</span>
          <span className="text-[11px] font-light text-t-muted sm:text-[13px]">{s.label}</span>
        </div>
      ))}
    </div>
  );
}
