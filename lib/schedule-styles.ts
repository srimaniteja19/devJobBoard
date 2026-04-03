import type { CalendarItem } from "@/lib/applications";

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
