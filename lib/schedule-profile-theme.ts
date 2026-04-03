import type { LucideIcon } from "lucide-react";
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
} from "lucide-react";
import type { CalendarItem } from "@/lib/applications";
import { EVENT_LABELS, type EventType } from "@/types";
import type { ScheduleRowKind } from "@/lib/schedule-styles";

/** Solid accent fills for icon blocks + badges (profile card system). */
export const PROFILE_ACCENTS: Record<ScheduleRowKind, string> = {
  follow_up: "#F9A875",
  follow_up_event: "#D4A96A",
  phone_screen: "#67C9D4",
  technical: "#7B9FE8",
  behavioral: "#C084FC",
  onsite: "#6ECC9A",
  offer: "#86EFAC",
  rejection: "#F48FB1",
  other: "#B0B8C8",
};

export const PROFILE_ICONS: Record<ScheduleRowKind, LucideIcon> = {
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

export const PROFILE_LEGEND: { kind: ScheduleRowKind; label: string }[] = [
  { kind: "follow_up", label: "Reminder" },
  { kind: "follow_up_event", label: "Follow-up" },
  { kind: "phone_screen", label: "Phone" },
  { kind: "technical", label: "Technical" },
  { kind: "behavioral", label: "Behavioral" },
  { kind: "onsite", label: "On-site" },
  { kind: "offer", label: "Offer" },
  { kind: "rejection", label: "Outcome" },
  { kind: "other", label: "Misc" },
];

export function profileBadgeText(item: CalendarItem): string {
  if (item.type === "follow_up") return "Reminder";
  if (item.eventType === "FOLLOW_UP") return "Follow-up";
  if (item.eventType && item.eventType in EVENT_LABELS) {
    return EVENT_LABELS[item.eventType as EventType];
  }
  if (item.eventType) return item.eventType.replace(/_/g, " ");
  return "Event";
}

export function isScheduleDemoItem(item: CalendarItem): boolean {
  return item.applicationId === "demo" || item.id.startsWith("demo-");
}
