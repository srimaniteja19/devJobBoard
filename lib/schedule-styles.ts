import type { CalendarItem } from "@/lib/applications";
import { EVENT_LABELS, type EventType } from "@/types";

export type ScheduleRowKind =
  | "follow_up"
  | "follow_up_event"
  | "phone_screen"
  | "technical"
  | "behavioral"
  | "onsite"
  | "offer"
  | "rejection"
  | "other";

export function scheduleRowKindFromItem(item: CalendarItem): ScheduleRowKind {
  if (item.type === "follow_up") return "follow_up";
  const t = item.eventType;
  switch (t) {
    case "PHONE_SCREEN":
      return "phone_screen";
    case "TECHNICAL":
      return "technical";
    case "BEHAVIORAL":
      return "behavioral";
    case "ONSITE":
      return "onsite";
    case "OFFER":
      return "offer";
    case "REJECTION":
      return "rejection";
    case "FOLLOW_UP":
      return "follow_up_event";
    default:
      return "other";
  }
}

/** Tokens from globals.css: --schedule-{kind}-* */
export function scheduleRowPalette(kind: ScheduleRowKind) {
  const v = (token: string) => `var(--schedule-${kind}-${token})`;
  return {
    bg: v("bg"),
    border: v("border"),
    accent: v("accent"),
    title: v("title"),
    muted: v("muted"),
  };
}

export function scheduleKindLabel(item: CalendarItem): string {
  if (item.type === "follow_up") return "Follow-up";
  if (item.eventType && item.eventType in EVENT_LABELS) {
    return EVENT_LABELS[item.eventType as EventType];
  }
  if (item.eventType) return item.eventType.replace(/_/g, " ");
  return "Event";
}
