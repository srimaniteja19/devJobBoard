import type { Event } from "@prisma/client";
import { startOfLocalDay } from "@/lib/date-helpers";
import { EVENT_LABELS, type EventType } from "@/types";

export type KanbanScheduleHintSerialized = {
  at: string;
  label: string;
  kind: "event" | "follow_up";
};

/**
 * Picks the soonest upcoming calendar item for a Kanban card: next scheduled event
 * (from today onward) or a follow-up date on/after today, whichever comes first.
 */
export function buildKanbanScheduleHint(
  followUpDate: Date | null,
  nextEvents: Pick<Event, "scheduledAt" | "type">[]
): KanbanScheduleHintSerialized | null {
  const nextEvent = nextEvents[0];
  const todayStart = startOfLocalDay(new Date()).getTime();
  const candidates: {
    t: number;
    at: Date;
    label: string;
    kind: "event" | "follow_up";
  }[] = [];

  if (nextEvent) {
    candidates.push({
      t: nextEvent.scheduledAt.getTime(),
      at: nextEvent.scheduledAt,
      label:
        EVENT_LABELS[nextEvent.type as EventType] ??
        nextEvent.type ??
        "Event",
      kind: "event",
    });
  }

  if (followUpDate && followUpDate.getTime() >= todayStart) {
    candidates.push({
      t: followUpDate.getTime(),
      at: followUpDate,
      label: "Follow up",
      kind: "follow_up",
    });
  }

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => a.t - b.t);
  const best = candidates[0]!;
  return {
    at: best.at.toISOString(),
    label: best.label,
    kind: best.kind,
  };
}
