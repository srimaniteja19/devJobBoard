import type { CalendarItem } from "@/lib/applications";
import { getCalendarItems } from "@/lib/applications";
import { endOfLocalDay, parseYMDLocal, startOfLocalDay } from "@/lib/date-helpers";

/** Event types that are interviews or screening-style calls. */
export const INTERVIEW_SCREEN_EVENT_TYPES = new Set([
  "PHONE_SCREEN",
  "TECHNICAL",
  "BEHAVIORAL",
  "ONSITE",
]);

export type ScheduleFilter = "all" | "interviews" | "follow_ups";

export function itemStartMs(item: CalendarItem): number {
  if (item.startAt) return new Date(item.startAt).getTime();
  return parseYMDLocal(item.date).getTime();
}

export function sortCalendarItemsByStart(items: CalendarItem[]): CalendarItem[] {
  return [...items].sort((a, b) => itemStartMs(a) - itemStartMs(b));
}

export function isInterviewOrScreenItem(item: CalendarItem): boolean {
  if (item.type !== "event" || !item.eventType) return false;
  return INTERVIEW_SCREEN_EVENT_TYPES.has(item.eventType);
}

export function filterScheduleItems(
  items: CalendarItem[],
  filter: ScheduleFilter
): CalendarItem[] {
  if (filter === "all") return items;
  if (filter === "follow_ups") return items.filter((i) => i.type === "follow_up");
  return items.filter((i) => isInterviewOrScreenItem(i));
}

/** Loads calendar items for a rolling window and sorts by start time. */
export async function getScheduleWindow(
  userId: string,
  opts?: { pastDays?: number; futureDays?: number }
): Promise<CalendarItem[]> {
  const pastDays = opts?.pastDays ?? 0;
  const futureDays = opts?.futureDays ?? 56;
  const today = startOfLocalDay(new Date());
  const start = new Date(today);
  start.setDate(start.getDate() - pastDays);
  const end = new Date(today);
  end.setDate(end.getDate() + futureDays);
  const items = await getCalendarItems(userId, start, endOfLocalDay(end));
  return sortCalendarItemsByStart(items);
}

export function groupItemsByDate(items: CalendarItem[]): Map<string, CalendarItem[]> {
  const map = new Map<string, CalendarItem[]>();
  for (const item of items) {
    const list = map.get(item.date);
    if (list) list.push(item);
    else map.set(item.date, [item]);
  }
  return map;
}
