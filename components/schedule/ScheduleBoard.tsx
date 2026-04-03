"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format, isToday, isTomorrow } from "date-fns";
import {
  Building2,
  CalendarClock,
  CalendarRange,
  Code2,
  Phone,
  Sparkles,
  Users,
  XCircle,
  CircleDot,
  type LucideIcon,
} from "lucide-react";
import type { CalendarItem } from "@/lib/applications";
import {
  filterScheduleItems,
  groupItemsByDate,
  itemStartMs,
  type ScheduleFilter,
} from "@/lib/schedule";
import {
  scheduleKindLabel,
  scheduleRowKindFromItem,
  scheduleRowPalette,
  type ScheduleRowKind,
} from "@/lib/schedule-styles";
import { parseYMDLocal } from "@/lib/date-helpers";

const KIND_ICON: Record<ScheduleRowKind, LucideIcon> = {
  follow_up: CalendarClock,
  follow_up_event: CalendarRange,
  phone_screen: Phone,
  technical: Code2,
  behavioral: Users,
  onsite: Building2,
  offer: Sparkles,
  rejection: XCircle,
  other: CircleDot,
};

const LEGEND_ITEMS: { kind: ScheduleRowKind; short: string }[] = [
  { kind: "follow_up", short: "Reminder" },
  { kind: "follow_up_event", short: "Follow-up" },
  { kind: "phone_screen", short: "Phone" },
  { kind: "technical", short: "Technical" },
  { kind: "behavioral", short: "Behavioral" },
  { kind: "onsite", short: "On-site" },
  { kind: "offer", short: "Offer" },
  { kind: "rejection", short: "Outcome" },
  { kind: "other", short: "Misc" },
];

function formatDayHeading(ymd: string): string {
  const d = parseYMDLocal(ymd);
  if (isToday(d)) return `Today · ${format(d, "MMM d")}`;
  if (isTomorrow(d)) return `Tomorrow · ${format(d, "MMM d")}`;
  return format(d, "EEEE, MMM d");
}

function formatTimeRange(item: CalendarItem): string {
  if (!item.startAt) return "All day";
  const start = new Date(item.startAt);
  const tf = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  if (!item.endAt) return tf.format(start);
  const end = new Date(item.endAt);
  return `${tf.format(start)} – ${tf.format(end)}`;
}

function isPastItem(item: CalendarItem): boolean {
  const end = item.endAt
    ? new Date(item.endAt).getTime()
    : item.startAt
      ? new Date(item.startAt).getTime() + 60 * 60 * 1000
      : parseYMDLocal(item.date).getTime() + 24 * 60 * 60 * 1000;
  return end < Date.now();
}

const FILTERS: { id: ScheduleFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "interviews", label: "Interviews & screens" },
  { id: "follow_ups", label: "Follow-ups" },
];

const sans = { fontFamily: "'DM Sans', sans-serif" } as const;

interface Props {
  initialItems: CalendarItem[];
}

export default function ScheduleBoard({ initialItems }: Props) {
  const [filter, setFilter] = useState<ScheduleFilter>("all");

  const filtered = useMemo(
    () => filterScheduleItems(initialItems, filter),
    [initialItems, filter]
  );

  const groups = useMemo(() => {
    const map = groupItemsByDate(filtered);
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const now = Date.now();

  return (
    <div className="relative z-10 space-y-7">
      <div className="flex flex-col gap-4 sm:gap-5">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`rounded-full border px-4 py-2 text-[12px] font-medium backdrop-blur-md transition-all duration-200 ${
                filter === f.id
                  ? "border-white/70 bg-white/55 text-t-primary shadow-md shadow-violet-500/10 dark:border-white/15 dark:bg-white/15 dark:text-t-primary"
                  : "border-white/50 bg-white/30 text-t-muted hover:border-white/70 hover:bg-white/45 dark:border-white/10 dark:bg-white/[0.07] dark:hover:bg-white/10"
              }`}
              style={sans}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div
          className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-white/55 bg-white/35 px-4 py-3 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06]"
          style={sans}
        >
          <span className="text-[10px] font-semibold uppercase tracking-widest text-t-muted">
            Key
          </span>
          {LEGEND_ITEMS.map(({ kind, short }) => {
            const p = scheduleRowPalette(kind);
            return (
              <span
                key={kind}
                className="inline-flex items-center gap-1.5 text-[11px] font-medium text-t-muted"
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full shadow-sm ring-2 ring-white/70 dark:ring-white/15"
                  style={{
                    backgroundColor: p.accent,
                    boxShadow: `0 0 12px color-mix(in srgb, ${p.accent} 45%, transparent)`,
                  }}
                  aria-hidden
                />
                {short}
              </span>
            );
          })}
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/50 bg-white/30 px-6 py-16 text-center shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]">
          <p
            className="text-[15px] font-medium text-t-primary"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Nothing in this view
          </p>
          <p className="mt-2 text-[12px] font-light text-t-muted" style={sans}>
            Add dated events on an application, or set a follow-up date on the
            board.
          </p>
          <Link
            href="/applications"
            className="mt-5 inline-block rounded-full border border-white/60 bg-white/40 px-4 py-2 text-[12px] font-medium text-t-primary shadow-sm backdrop-blur-md transition-theme hover:bg-white/60 dark:border-white/12 dark:bg-white/10 dark:hover:bg-white/15"
            style={sans}
          >
            Go to applications
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map(([ymd, dayItems]) => (
            <section
              key={ymd}
              className="rounded-[1.65rem] border p-5 shadow-[var(--schedule-day-panel-shadow)] backdrop-blur-2xl sm:p-6"
              style={{
                backgroundColor: "var(--schedule-day-panel-bg)",
                borderColor: "var(--schedule-day-panel-border)",
              }}
            >
              <h2
                className="mb-5 text-[17px] font-medium tracking-tight text-t-primary sm:text-[19px]"
                style={{ fontFamily: "'Instrument Serif', serif" }}
              >
                {formatDayHeading(ymd)}
              </h2>
              <ul className="space-y-4">
                {dayItems.map((item) => {
                  const past = isPastItem(item);
                  const soon =
                    !past &&
                    item.startAt &&
                    itemStartMs(item) - now < 24 * 60 * 60 * 1000;
                  const kind = scheduleRowKindFromItem(item);
                  const palette = scheduleRowPalette(kind);
                  const Icon = KIND_ICON[kind];
                  const kindLabel = scheduleKindLabel(item);

                  return (
                    <li key={item.id}>
                      <Link
                        href={`/applications/${item.applicationId}`}
                        className={`group relative block overflow-hidden rounded-2xl border shadow-[var(--schedule-card-float)] backdrop-blur-xl transition-all duration-300 ease-out will-change-transform hover:shadow-[var(--schedule-card-float-hover)] ${
                          past
                            ? "opacity-55 saturate-[0.85]"
                            : "hover:-translate-y-1"
                        }`}
                        style={{
                          borderColor: palette.border,
                          backgroundColor: palette.bg,
                          ...(soon && !past
                            ? {
                                outline: `2px solid color-mix(in srgb, ${palette.accent} 42%, transparent)`,
                                outlineOffset: 3,
                              }
                            : {}),
                        }}
                      >
                        <div
                          className="pointer-events-none absolute inset-y-3 left-0 w-[3px] rounded-full opacity-90"
                          style={{
                            background: `linear-gradient(180deg, color-mix(in srgb, ${palette.accent} 20%, transparent), ${palette.accent}, color-mix(in srgb, ${palette.accent} 20%, transparent))`,
                            boxShadow: `0 0 16px color-mix(in srgb, ${palette.accent} 50%, transparent)`,
                          }}
                          aria-hidden
                        />

                        <div className="relative flex flex-col gap-4 p-4 pl-5 backdrop-blur-[2px] sm:flex-row sm:items-center sm:gap-6 sm:p-5 sm:pl-7">
                          <div className="flex shrink-0 items-center gap-3.5 sm:w-[188px] sm:items-start">
                            <div
                              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/60 bg-white/45 shadow-sm backdrop-blur-md dark:border-white/12 dark:bg-white/10"
                              style={{
                                boxShadow: `0 4px 20px -4px color-mix(in srgb, ${palette.accent} 25%, transparent)`,
                              }}
                            >
                              <Icon
                                className="h-[19px] w-[19px]"
                                style={{ color: palette.accent }}
                                strokeWidth={1.75}
                                aria-hidden
                              />
                            </div>
                            <div className="min-w-0">
                              <p
                                className="font-mono text-[12px] font-medium tabular-nums leading-tight sm:text-[13px]"
                                style={{ color: palette.title }}
                              >
                                {formatTimeRange(item)}
                              </p>
                              {soon && !past && (
                                <p
                                  className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.14em]"
                                  style={{ color: palette.accent }}
                                >
                                  Soon
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="min-w-0 flex-1" style={sans}>
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className="text-[14px] font-semibold leading-snug transition-opacity group-hover:opacity-90 sm:text-[15px]"
                                style={{ color: palette.title }}
                              >
                                {item.title}
                              </span>
                              <span
                                className="rounded-full border border-white/55 bg-white/35 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider backdrop-blur-sm dark:border-white/10 dark:bg-white/10"
                                style={{
                                  color: palette.title,
                                  borderColor: `color-mix(in srgb, ${palette.accent} 35%, rgba(255,255,255,0.5))`,
                                }}
                              >
                                {kindLabel}
                              </span>
                            </div>
                            {item.subtitle && (
                              <p
                                className="mt-1.5 line-clamp-2 text-[12px] font-normal leading-relaxed"
                                style={{ color: palette.muted }}
                              >
                                {item.subtitle}
                              </p>
                            )}
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
