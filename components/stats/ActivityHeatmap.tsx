"use client";

import { toYMDLocal } from "@/lib/date-helpers";

interface Props {
  data: Record<string, number>;
}

export default function ActivityHeatmap({ data }: Props) {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 364);
  startDate.setDate(startDate.getDate() - startDate.getDay());

  const weeks: { date: Date; count: number }[][] = [];
  let current = new Date(startDate);

  while (current <= today) {
    const week: { date: Date; count: number }[] = [];
    for (let d = 0; d < 7; d++) {
      const key = toYMDLocal(current);
      week.push({ date: new Date(current), count: data[key] ?? 0 });
      current.setDate(current.getDate() + 1);
    }
    weeks.push(week);
  }

  const maxCount = Math.max(1, ...Object.values(data));

  const getColor = (count: number) => {
    if (count === 0) return "#1a1a1a";
    const intensity = Math.min(count / maxCount, 1);
    if (intensity <= 0.25) return "#3a4a10";
    if (intensity <= 0.5) return "#6a8a18";
    if (intensity <= 0.75) return "#a8cc28";
    return "#e8ff47";
  };

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  return (
    <div className="border border-edge bg-surface p-4 sm:p-5">
      <h3 className="mb-3 text-[11px] font-medium uppercase tracking-widest text-t-muted sm:mb-4">
        Application Activity
      </h3>
      <div className="overflow-x-auto">
        <div className="inline-flex flex-col gap-1">
          <div className="flex gap-[3px] pl-[28px]">
            {weeks.map((week, wi) => {
              const firstDay = week[0]?.date;
              const showMonth = firstDay && firstDay.getDate() <= 7;
              return (
                <div key={wi} className="w-[11px] text-center">
                  {showMonth && (
                    <span className="text-[9px] text-t-faint">
                      {months[firstDay.getMonth()]}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex gap-0">
            <div className="flex flex-col gap-[3px] pr-1.5">
              {["", "Mon", "", "Wed", "", "Fri", ""].map((d, i) => (
                <div key={i} className="flex h-[11px] items-center">
                  <span className="w-[24px] text-right text-[9px] text-t-faint">{d}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-[3px]">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[3px]">
                  {week.map((day, di) => (
                    <div
                      key={di}
                      className="h-[11px] w-[11px] rounded-[2px]"
                      style={{ backgroundColor: getColor(day.count) }}
                      title={`${toYMDLocal(day.date)}: ${day.count} applications`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-1 flex items-center justify-end gap-1">
            <span className="text-[9px] text-t-faint">Less</span>
            {[0, 1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className="h-[9px] w-[9px] rounded-[2px]"
                style={{ backgroundColor: getColor(level === 0 ? 0 : (level / 4) * maxCount) }}
              />
            ))}
            <span className="text-[9px] text-t-faint">More</span>
          </div>
        </div>
      </div>
    </div>
  );
}
