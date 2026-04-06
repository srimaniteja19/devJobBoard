import { prisma } from "@/lib/db";
import { endOfLocalDay, startOfLocalDay, toYMDLocal } from "@/lib/date-helpers";
import { EVENT_LABELS, type AppStatus } from "@/types";

export type WeekPacketEntry = {
  eventId: string;
  scheduledAt: string;
  eventType: string;
  eventLabel: string;
  eventNotes: string | null;
  company: string;
  role: string;
  applicationId: string;
  prepStage: AppStatus;
  preps: Record<string, unknown>;
};

/** Prep stage whose generated sections best match this calendar event type. */
export function prepStageForEventType(type: string): AppStatus {
  switch (type) {
    case "PHONE_SCREEN":
    case "FOLLOW_UP":
      return "SCREENING";
    case "OFFER":
      return "OFFER";
    case "REJECTION":
      return "REJECTED";
    case "TECHNICAL":
    case "BEHAVIORAL":
    case "ONSITE":
    case "OTHER":
    default:
      return "INTERVIEW";
  }
}

/**
 * Events in the next 7 local calendar days (today through today + 6), with parsed prep
 * for the stage that matches each event type.
 */
export async function getWeekInterviewPacketData(userId: string): Promise<{
  rangeStartYmd: string;
  rangeEndYmd: string;
  entries: WeekPacketEntry[];
}> {
  const start = startOfLocalDay(new Date());
  const lastDay = new Date(start);
  lastDay.setDate(lastDay.getDate() + 6);
  const end = endOfLocalDay(lastDay);

  const events = await prisma.event.findMany({
    where: {
      scheduledAt: { gte: start, lte: end },
      application: { userId },
    },
    include: {
      application: { select: { id: true, company: true, role: true, status: true } },
    },
    orderBy: { scheduledAt: "asc" },
  });

  const stageByApp = new Map<string, Set<AppStatus>>();
  for (const e of events) {
    const stage = prepStageForEventType(e.type);
    if (!stageByApp.has(e.applicationId)) stageByApp.set(e.applicationId, new Set());
    stageByApp.get(e.applicationId)!.add(stage);
  }

  const appIds = Array.from(stageByApp.keys());
  const stageFilters = new Set<AppStatus>();
  stageByApp.forEach((set) => {
    set.forEach((s) => stageFilters.add(s));
  });

  const prepRows =
    appIds.length === 0
      ? []
      : await prisma.applicationPrep.findMany({
          where: {
            applicationId: { in: appIds },
            stage: { in: Array.from(stageFilters) },
          },
        });

  const prepMap = new Map<string, Record<string, unknown>>();
  for (const row of prepRows) {
    const key = `${row.applicationId}::${row.stage}`;
    if (!prepMap.has(key)) prepMap.set(key, {});
    const bucket = prepMap.get(key)!;
    try {
      bucket[row.sectionKey] = JSON.parse(row.content);
    } catch {
      bucket[row.sectionKey] = row.content;
    }
  }

  const entries: WeekPacketEntry[] = [];
  for (const event of events) {
    const app = event.application;
    if (!app) continue;
    const prepStage = prepStageForEventType(event.type);
    const preps = prepMap.get(`${event.applicationId}::${prepStage}`) ?? {};
    const eventLabel =
      (event.type && EVENT_LABELS[event.type as keyof typeof EVENT_LABELS]) ?? event.type ?? "Event";
    entries.push({
      eventId: event.id,
      scheduledAt: event.scheduledAt.toISOString(),
      eventType: event.type,
      eventLabel,
      eventNotes: event.notes,
      company: app.company,
      role: app.role,
      applicationId: app.id,
      prepStage,
      preps,
    });
  }

  return {
    rangeStartYmd: toYMDLocal(start),
    rangeEndYmd: toYMDLocal(lastDay),
    entries,
  };
}
