"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, FileDown, X } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns";
import { STATUS_COLORS } from "@/types";
import type { AppStatus } from "@/types";
import type { CalendarItem } from "@/lib/applications";

const STATUS_BG: Record<string, string> = {
  WISHLIST: "bg-[var(--status-wishlist-bg)]",
  APPLIED: "bg-[var(--status-applied-bg)]",
  SCREENING: "bg-[var(--status-screening-bg)]",
  INTERVIEW: "bg-[var(--status-interview-bg)]",
  OFFER: "bg-[var(--status-offer-bg)]",
  REJECTED: "bg-[var(--status-rejected-bg)]",
  GHOSTED: "bg-[var(--status-ghosted-bg)]",
};

const STATUS_TEXT: Record<string, string> = {
  WISHLIST: "text-[#555]",
  APPLIED: "text-[#a78bfa]",
  SCREENING: "text-[#fbbf24]",
  INTERVIEW: "text-[#fb923c]",
  OFFER: "text-[var(--status-offer-text)]",
  REJECTED: "text-[#f87171]",
  GHOSTED: "text-[#444]",
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface Props {
  initialItems: CalendarItem[];
}

export default function InterviewCalendar({ initialItems }: Props) {
  const [viewDate, setViewDate] = useState(new Date());
  const [items, setItems] = useState<CalendarItem[]>(initialItems);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const fetchItems = useCallback(async (start: Date, end: Date) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/calendar?start=${start.toISOString().slice(0, 10)}&end=${end.toISOString().slice(0, 10)}`
      );
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setItems(data);
      }
    } catch {
      // keep existing
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const start = subMonths(startOfMonth(viewDate), 1);
    const end = addMonths(endOfMonth(viewDate), 1);
    fetchItems(start, end);
  }, [viewDate, fetchItems]);

  const itemsByDate = items.reduce<Record<string, CalendarItem[]>>((acc, item) => {
    if (!acc[item.date]) acc[item.date] = [];
    acc[item.date].push(item);
    return acc;
  }, {});

  const selectedItems = selectedDate ? itemsByDate[selectedDate] ?? [] : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewDate((d) => subMonths(d, 1))}
            className="rounded border border-edge bg-surface p-1.5 text-t-muted transition-theme hover:bg-bg hover:text-t-primary"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h2 className="min-w-[160px] text-center text-[16px] font-medium text-t-primary">
            {format(viewDate, "MMMM yyyy")}
          </h2>
          <button
            type="button"
            onClick={() => setViewDate((d) => addMonths(d, 1))}
            className="rounded border border-edge bg-surface p-1.5 text-t-muted transition-theme hover:bg-bg hover:text-t-primary"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <a
          href="/api/calendar/ics"
          download="jobtracker-calendar.ics"
          className="inline-flex items-center gap-2 border border-accent bg-transparent px-3 py-1.5 text-[12px] font-medium text-accent transition-all duration-150 hover:bg-accent/10"
        >
          <FileDown className="h-4 w-4" />
          Export .ics
        </a>
      </div>

      {loading && (
        <p className="text-[12px] font-light text-t-faint">Loading calendar...</p>
      )}

      <div className="border border-edge bg-surface p-3 sm:p-4">
        <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] font-medium uppercase tracking-wider text-t-muted sm:text-[11px]">
          {DAY_NAMES.map((d) => (
            <div key={d} className="py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-0.5">
          {days.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const dayItems = itemsByDate[dateStr] ?? [];
            const isCurrentMonth = isSameMonth(day, viewDate);
            const isSelected = selectedDate === dateStr;
            const isToday = isSameDay(day, new Date());

            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => setSelectedDate((s) => (s === dateStr ? null : dateStr))}
                className={`min-h-[48px] rounded p-1 text-left text-[12px] transition-theme sm:min-h-[64px] ${
                  !isCurrentMonth ? "text-t-faint" : "text-t-primary"
                } ${isSelected ? "ring-1 ring-accent bg-accent/5" : "hover:bg-bg"} ${
                  isToday ? "border border-accent/50" : ""
                }`}
              >
                <span className={isToday ? "font-medium text-accent" : ""}>
                  {format(day, "d")}
                </span>
                <div className="mt-0.5 flex flex-col gap-0.5">
                  {dayItems.slice(0, 2).map((item) => (
                    <span
                      key={item.id}
                      className={`truncate rounded px-0.5 py-0.5 text-[9px] font-medium ${
                        STATUS_BG[item.status] ?? "bg-[var(--color-edge)]"
                      } ${STATUS_COLORS[item.status as AppStatus] ?? "text-t-muted"}`}
                    >
                      {item.type === "follow_up" ? "Follow up" : "Event"} · {item.title.split(": ")[1] ?? item.title}
                    </span>
                  ))}
                  {dayItems.length > 2 && (
                    <span className="text-[9px] text-t-faint">+{dayItems.length - 2}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selectedDate && (
        <div className="border border-edge bg-surface p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[11px] font-medium uppercase tracking-widest text-t-muted">
              {format(new Date(selectedDate + "T12:00:00"), "EEEE, MMM d")}
            </h3>
            <button
              type="button"
              onClick={() => setSelectedDate(null)}
              className="rounded p-1 text-t-faint transition-theme hover:bg-bg hover:text-t-primary"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {selectedItems.length === 0 ? (
            <p className="text-[12px] font-light text-t-faint">Nothing scheduled</p>
          ) : (
            <div className="space-y-2">
              {selectedItems.map((item) => (
                <Link
                  key={item.id}
                  href={`/applications/${item.applicationId}`}
                  className={`block rounded border border-edge p-3 transition-theme hover:border-accent/50 ${
                    STATUS_BG[item.status] ?? "bg-bg"
                  }`}
                >
                  <span className={`text-[12px] font-medium ${STATUS_COLORS[item.status as AppStatus] ?? "text-t-primary"}`}>
                    {item.title}
                  </span>
                  {item.subtitle && (
                    <p className="mt-0.5 text-[11px] font-light text-t-muted">{item.subtitle}</p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
