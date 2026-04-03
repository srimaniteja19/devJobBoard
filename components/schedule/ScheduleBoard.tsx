"use client";

import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { format, isToday, isTomorrow } from "date-fns";
import { motion, LayoutGroup } from "framer-motion";
import type { CalendarItem } from "@/lib/applications";
import {
  filterScheduleItems,
  groupItemsByDate,
  itemStartMs,
  type ScheduleFilter,
} from "@/lib/schedule";
import { scheduleRowKindFromItem } from "@/lib/schedule-styles";
import {
  PROFILE_ACCENTS,
  PROFILE_ICONS,
  PROFILE_LEGEND,
  profileBadgeText,
  isScheduleDemoItem,
} from "@/lib/schedule-profile-theme";
import { parseYMDLocal } from "@/lib/date-helpers";

const FILTERS: { id: ScheduleFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "interviews", label: "Interviews & screens" },
  { id: "follow_ups", label: "Follow-ups" },
];

const sans: CSSProperties = { fontFamily: "'DM Sans', sans-serif" };

function formatEventDateLine(ymd: string): string {
  const d = parseYMDLocal(ymd);
  if (isToday(d)) return `Today · ${format(d, "MMM d, yyyy")}`;
  if (isTomorrow(d)) return `Tomorrow · ${format(d, "MMM d, yyyy")}`;
  return format(d, "EEE, MMM d, yyyy");
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

function itemHref(item: CalendarItem): string {
  if (isScheduleDemoItem(item)) return "/schedule?demo=1";
  return `/applications/${item.applicationId}`;
}

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
    <div className="space-y-6" style={sans}>
      <LayoutGroup>
        <div className="relative inline-flex rounded-full bg-zinc-200/60 p-0.5 ring-1 ring-zinc-300/50">
          {FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`relative rounded-full px-3.5 py-1.5 text-[11px] font-medium transition-colors duration-200 sm:px-4 sm:py-2 sm:text-[12px] ${
                  active ? "text-zinc-900" : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="schedule-filter-active"
                    className="absolute inset-0 rounded-full bg-white shadow-sm ring-1 ring-zinc-200/70"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative z-10">{f.label}</span>
              </button>
            );
          })}
        </div>
      </LayoutGroup>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-zinc-200/70 bg-white/70 px-3 py-2.5 shadow-sm backdrop-blur-md sm:gap-x-4 sm:px-4">
        <span className="text-[9px] font-semibold uppercase tracking-widest text-zinc-400">
          Key
        </span>
        {PROFILE_LEGEND.map(({ kind, label }) => {
          const accent = PROFILE_ACCENTS[kind];
          const Icon = PROFILE_ICONS[kind];
          return (
            <span
              key={kind}
              className="inline-flex items-center gap-1.5 text-[10px] font-medium text-zinc-600 sm:text-[11px]"
            >
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-white"
                style={{ backgroundColor: accent }}
                aria-hidden
              >
                <Icon className="h-3 w-3" strokeWidth={2.25} />
              </span>
              {label}
            </span>
          );
        })}
      </div>

      {groups.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200/70 bg-white/80 px-5 py-14 text-center shadow-sm backdrop-blur-md sm:px-6">
          <p className="text-[15px] font-semibold text-zinc-900">
            Nothing in this view
          </p>
          <p className="mt-2 text-[12px] font-light leading-relaxed text-zinc-500">
            Add events on an application or set a follow-up date.{" "}
            <code className="font-schedule-mono rounded bg-zinc-100/90 px-1 py-0.5 text-[10px] text-zinc-700">
              ?demo=1
            </code>{" "}
            for samples.
          </p>
          <Link
            href="/applications"
            className="mt-4 inline-block rounded-full bg-zinc-900 px-4 py-2 text-[11px] font-medium text-white transition-opacity hover:opacity-90"
          >
            Applications
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map(([ymd, dayItems]) => (
            <section
              key={ymd}
              className="rounded-2xl border border-white/60 bg-white/55 p-5 shadow-sm backdrop-blur-md sm:p-6"
            >
              <h2 className="mb-4 border-b border-zinc-200/60 pb-3 text-base font-semibold tracking-tight text-zinc-900 sm:mb-5 sm:text-lg">
                {formatEventDateLine(ymd)}
              </h2>

              <ul className="mx-auto flex max-w-xl flex-col gap-3">
                {dayItems.map((item) => {
                  const past = isPastItem(item);
                  const showSoon =
                    !past &&
                    item.startAt != null &&
                    itemStartMs(item) - now < 24 * 60 * 60 * 1000;
                  const kind = scheduleRowKindFromItem(item);
                  const accent = PROFILE_ACCENTS[kind];
                  const Icon = PROFILE_ICONS[kind];
                  const badge = profileBadgeText(item).toUpperCase();
                  const timeLine = formatTimeRange(item);
                  const dateLine = formatEventDateLine(item.date);

                  return (
                    <li key={item.id}>
                      <Link
                        href={itemHref(item)}
                        className={`flex gap-4 rounded-xl border border-zinc-200/60 bg-white/85 p-4 shadow-sm backdrop-blur-sm transition-all duration-200 sm:gap-5 sm:p-4 ${
                          past
                            ? "opacity-55"
                            : "hover:border-zinc-300/80 hover:bg-white hover:shadow-md"
                        }`}
                        style={
                          showSoon
                            ? {
                                boxShadow: `0 0 0 1px ${accent}, 0 4px 14px -4px rgba(0,0,0,0.08)`,
                              }
                            : undefined
                        }
                      >
                        <div
                          className="flex h-[3.25rem] w-[3.25rem] shrink-0 items-center justify-center rounded-xl text-white sm:h-14 sm:w-14"
                          style={{ backgroundColor: accent }}
                        >
                          <Icon className="h-6 w-6" strokeWidth={2} aria-hidden />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                            <div className="min-w-0 space-y-0.5">
                              <p className="text-[11px] font-medium text-zinc-500">
                                {dateLine}
                              </p>
                              <p className="font-schedule-mono text-[13px] text-zinc-700 sm:text-sm">
                                {timeLine}
                              </p>
                              {showSoon && (
                                <p
                                  className="text-[9px] font-semibold uppercase tracking-wider"
                                  style={{ color: accent }}
                                >
                                  Soon
                                </p>
                              )}
                            </div>
                            <span
                              className="w-fit shrink-0 rounded-md px-2 py-1 text-[9px] font-bold uppercase leading-tight tracking-wide text-white sm:px-2.5 sm:py-1 sm:text-[10px]"
                              style={{ backgroundColor: accent }}
                            >
                              {badge}
                            </span>
                          </div>

                          <h3 className="font-schedule-mono mt-3 text-[15px] font-semibold leading-snug text-zinc-900 sm:text-base">
                            {item.title}
                          </h3>
                          {item.subtitle ? (
                            <p className="font-schedule-mono mt-1 text-[12px] leading-relaxed text-zinc-500 sm:text-[13px]">
                              {item.subtitle}
                            </p>
                          ) : null}
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
