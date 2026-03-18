import { prisma } from "@/lib/db";
import { EVENT_LABELS, type AppStatus } from "@/types";
import { endOfLocalDay, parseYMDLocal, startOfLocalDay, toYMDLocal } from "@/lib/date-helpers";

function diffDaysLocal(from: Date, to: Date): number {
  // Convert local calendar dates to UTC-only midnights so day differences
  // aren't affected by local DST transitions.
  const [fy, fm, fd] = toYMDLocal(from).split("-").map(Number);
  const [ty, tm, td] = toYMDLocal(to).split("-").map(Number);
  const fromUTC = Date.UTC(fy, fm - 1, fd);
  const toUTC = Date.UTC(ty, tm - 1, td);
  return (toUTC - fromUTC) / 86400000;
}

export async function recordStatusHistory(
  applicationId: string,
  fromStatus: string | null,
  toStatus: string
) {
  if (!toStatus || fromStatus === toStatus) return;
  await prisma.applicationStatusHistory.create({
    data: {
      applicationId,
      fromStatus: fromStatus || null,
      toStatus,
    },
  });
}

export async function getUserApplications(userId: string) {
  return prisma.application.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: { resumeMatch: true },
  });
}

export async function getApplicationById(id: string, userId: string) {
  return prisma.application.findFirst({
    where: { id, userId },
    include: {
      contacts: true,
      events: { orderBy: { scheduledAt: "desc" } },
      resumeMatch: true,
    },
  });
}

export type ApplicationWithRelations = NonNullable<
  Awaited<ReturnType<typeof getApplicationById>>
>;

export async function getPrepsForStage(
  applicationId: string,
  userId: string,
  stage: string
): Promise<Record<string, unknown> | null> {
  const app = await prisma.application.findFirst({
    where: { id: applicationId, userId },
    include: { preps: { where: { stage } } },
  });
  if (!app) return null;
  const result: Record<string, unknown> = {};
  for (const p of app.preps) {
    try {
      result[p.sectionKey] = JSON.parse(p.content);
    } catch {
      result[p.sectionKey] = p.content;
    }
  }
  return result;
}

/** Counts per status for today, this week, this month. Uses appliedAt/createdAt for APPLIED, updatedAt for others. */
export async function getActivityByPeriod(userId: string) {
  const apps = await prisma.application.findMany({
    where: { userId },
    select: { status: true, appliedAt: true, createdAt: true, updatedAt: true },
  });

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const monthStart = new Date(todayStart);
  monthStart.setDate(1);

  const addTo = (
    acc: Record<string, { today: number; week: number; month: number }>,
    status: string,
    date: Date
  ) => {
    if (!acc[status]) acc[status] = { today: 0, week: 0, month: 0 };
    if (date >= todayStart) acc[status].today++;
    if (date >= weekStart) acc[status].week++;
    if (date >= monthStart) acc[status].month++;
  };

  const result: Record<string, { today: number; week: number; month: number }> = {};
  for (const a of apps) {
    const date = a.status === "APPLIED" ? (a.appliedAt ?? a.createdAt) : a.updatedAt;
    addTo(result, a.status, date);
  }
  return result;
}

export async function getApplicationStats(userId: string) {
  const apps = await prisma.application.findMany({
    where: { userId },
    select: { status: true, appliedAt: true, createdAt: true, updatedAt: true },
  });

  const total = apps.length;
  const byStatus = apps.reduce(
    (acc, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const active = total - (byStatus.REJECTED || 0) - (byStatus.GHOSTED || 0);
  const interviews = byStatus.INTERVIEW || 0;
  const offers = byStatus.OFFER || 0;
  const rejections = byStatus.REJECTED || 0;
  const rejectionRate = total > 0 ? Math.round((rejections / total) * 100) : 0;

  return { total, active, interviews, offers, rejections, rejectionRate, byStatus };
}

/** Application streak: consecutive days with ≥1 application (using appliedAt or createdAt). */
export async function getApplicationStreak(userId: string): Promise<number> {
  const apps = await prisma.application.findMany({
    where: { userId },
    select: { appliedAt: true, createdAt: true },
  });

  const dateSet = new Set<string>();
  for (const a of apps) {
    const d = a.appliedAt ?? a.createdAt;
    if (d) dateSet.add(toYMDLocal(d));
  }
  const dates = Array.from(dateSet).sort().reverse();
  if (dates.length === 0) return 0;

  const today = toYMDLocal(new Date());
  if (dates[0] !== today) return 0; // Streak only counts when you applied today

  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const prevYMD = dates[i - 1];
    const currYMD = dates[i];
    const prevDate = parseYMDLocal(prevYMD);
    // `dates` is newest -> oldest, so consecutive means "curr is 1 day before prev".
    const expectedCurr = new Date(prevDate);
    expectedCurr.setDate(expectedCurr.getDate() - 1);
    if (toYMDLocal(expectedCurr) === currYMD) streak++;
    else break;
  }
  return streak;
}

export async function getWeeklyApplications(userId: string) {
  const twelveWeeksAgo = new Date();
  twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);

  const apps = await prisma.application.findMany({
    where: {
      userId,
      createdAt: { gte: twelveWeeksAgo },
    },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const weeks: Record<string, number> = {};
  for (const app of apps) {
    const d = app.createdAt;
    const weekStart = new Date(d);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const key = toYMDLocal(weekStart);
    weeks[key] = (weeks[key] || 0) + 1;
  }

  return Object.entries(weeks).map(([week, count]) => ({ week, count }));
}

export async function getAdvancedStats(userId: string) {
  const apps = await prisma.application.findMany({
    where: { userId },
    select: {
      status: true,
      appliedAt: true,
      createdAt: true,
      updatedAt: true,
      company: true,
      stack: true,
      resumeLabel: true,
    },
  });

  const applied = apps.filter((a) => a.status !== "WISHLIST");
  const screened = apps.filter((a) =>
    ["SCREENING", "INTERVIEW", "OFFER"].includes(a.status)
  );
  const interviewed = apps.filter((a) =>
    ["INTERVIEW", "OFFER"].includes(a.status)
  );

  const responseRate =
    applied.length > 0 ? Math.round((screened.length / applied.length) * 100) : 0;
  const interviewConversion =
    applied.length > 0 ? Math.round((interviewed.length / applied.length) * 100) : 0;

  const responseDays: number[] = [];
  for (const a of screened) {
    const from = a.appliedAt ?? a.createdAt;
    const diff = diffDaysLocal(from, a.updatedAt);
    if (diff >= 0) responseDays.push(Math.round(diff));
  }
  const avgDaysToResponse =
    responseDays.length > 0
      ? Math.round(responseDays.reduce((s, d) => s + d, 0) / responseDays.length)
      : 0;

  const companyCounts: Record<string, number> = {};
  for (const a of apps) {
    companyCounts[a.company] = (companyCounts[a.company] || 0) + 1;
  }
  const topCompanies = Object.entries(companyCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const stackCounts: Record<string, number> = {};
  const stackResponseCounts: Record<string, number> = {};
  for (const a of apps) {
    try {
      const tags: string[] = JSON.parse(a.stack);
      for (const t of tags) {
        stackCounts[t] = (stackCounts[t] || 0) + 1;
        if (["SCREENING", "INTERVIEW", "OFFER"].includes(a.status)) {
          stackResponseCounts[t] = (stackResponseCounts[t] || 0) + 1;
        }
      }
    } catch {}
  }
  const topStacks = Object.entries(stackCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const stackResponseRates = Object.entries(stackCounts)
    .filter(([_, count]) => count >= 2)
    .map(([tag, total]) => ({
      tag,
      total,
      responses: stackResponseCounts[tag] || 0,
      rate: Math.round(((stackResponseCounts[tag] || 0) / total) * 100),
    }))
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 8);

  // Status funnel
  const funnel = [
    { stage: "Applied", count: applied.length },
    { stage: "Screening", count: apps.filter((a) => ["SCREENING", "INTERVIEW", "OFFER"].includes(a.status)).length },
    { stage: "Interview", count: apps.filter((a) => ["INTERVIEW", "OFFER"].includes(a.status)).length },
    { stage: "Offer", count: apps.filter((a) => a.status === "OFFER").length },
  ];

  // Best day of week
  const dayOfWeekCounts = [0, 0, 0, 0, 0, 0, 0];
  const dayOfWeekResponses = [0, 0, 0, 0, 0, 0, 0];
  for (const a of apps) {
    const date = a.appliedAt ?? a.createdAt;
    const day = date.getDay();
    dayOfWeekCounts[day]++;
    if (["SCREENING", "INTERVIEW", "OFFER"].includes(a.status)) {
      dayOfWeekResponses[day]++;
    }
  }
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const bestDayData = dayNames.map((name, i) => ({
    day: name,
    applied: dayOfWeekCounts[i],
    responses: dayOfWeekResponses[i],
    rate: dayOfWeekCounts[i] > 0 ? Math.round((dayOfWeekResponses[i] / dayOfWeekCounts[i]) * 100) : 0,
  }));

  // Resume breakdown
  const resumeCounts: Record<string, { total: number; responses: number }> = {};
  for (const a of apps) {
    const label = a.resumeLabel || "None";
    if (!resumeCounts[label]) resumeCounts[label] = { total: 0, responses: 0 };
    resumeCounts[label].total++;
    if (["SCREENING", "INTERVIEW", "OFFER"].includes(a.status)) {
      resumeCounts[label].responses++;
    }
  }
  const resumeBreakdown = Object.entries(resumeCounts)
    .map(([label, { total, responses }]) => ({
      label,
      total,
      responses,
      rate: total > 0 ? Math.round((responses / total) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);

  // Status flow paths based on history
  const history = await prisma.applicationStatusHistory.findMany({
    where: { application: { userId } },
    select: {
      applicationId: true,
      fromStatus: true,
      toStatus: true,
      changedAt: true,
      application: {
        select: {
          company: true,
          role: true,
          id: true,
        },
      },
    },
    orderBy: { changedAt: "asc" },
  });

  type PathInfo = {
    path: string[];
    appId: string;
    company: string;
    role: string;
  };

  const pathsByApp = new Map<string, PathInfo>();
  for (const h of history) {
    const existing = pathsByApp.get(h.applicationId);
    const baseStatus = h.fromStatus ?? h.toStatus;
    if (!existing) {
      const initial: string[] = baseStatus ? [baseStatus] : [];
      const path =
        initial.length && initial[0] !== h.toStatus ? [...initial, h.toStatus] : [h.toStatus];
      pathsByApp.set(h.applicationId, {
        path,
        appId: h.application.id,
        company: h.application.company,
        role: h.application.role,
      });
      continue;
    }
    const arr = existing.path;
    if (arr[arr.length - 1] !== h.toStatus) {
      arr.push(h.toStatus);
    }
  }

  const flowCounts: Record<string, number> = {};
  const flowApps: Record<string, { id: string; company: string; role: string }[]> = {};
  let rejectedAfterScreening = 0;
  let rejectedAfterInterview = 0;
  let screenedTotal = 0;
  let interviewedTotal = 0;

  pathsByApp.forEach((info) => {
    const { path, appId, company, role } = info;
    const key = path.join(" → ");
    flowCounts[key] = (flowCounts[key] || 0) + 1;
    if (!flowApps[key]) flowApps[key] = [];
    flowApps[key].push({ id: appId, company, role });

    if (path.includes("SCREENING")) screenedTotal++;
    if (path.includes("INTERVIEW")) interviewedTotal++;

    if (path.includes("REJECTED")) {
      const rejectedIndex = path.indexOf("REJECTED");
      if (rejectedIndex > -1) {
        if (path.slice(0, rejectedIndex).includes("INTERVIEW")) {
          rejectedAfterInterview++;
        } else if (path.slice(0, rejectedIndex).includes("SCREENING")) {
          rejectedAfterScreening++;
        }
      }
    }
  });

  const flows = Object.entries(flowCounts)
    .map(([flow, count]) => ({
      flow,
      count,
      applications: flowApps[flow]?.slice(0, 10) ?? [],
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  const rejectionAfterScreeningRate =
    screenedTotal > 0 ? Math.round((rejectedAfterScreening / screenedTotal) * 100) : 0;
  const rejectionAfterInterviewRate =
    interviewedTotal > 0 ? Math.round((rejectedAfterInterview / interviewedTotal) * 100) : 0;

  // Daily activity for heatmap
  const dailyActivity: Record<string, number> = {};
  for (const a of apps) {
    const key = toYMDLocal(a.createdAt);
    dailyActivity[key] = (dailyActivity[key] || 0) + 1;
  }

  return {
    responseRate,
    interviewConversion,
    avgDaysToResponse,
    topCompanies,
    topStacks,
    stackResponseRates,
    funnel,
    bestDayData,
    resumeBreakdown,
    dailyActivity,
    flows,
    rejectionAfterScreeningRate,
    rejectionAfterInterviewRate,
  };
}

export async function getFollowUpReminders(userId: string) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(23, 59, 59, 999);

  return prisma.application.findMany({
    where: {
      userId,
      followUpDate: { lte: tomorrow },
      status: { in: ["APPLIED", "SCREENING"] },
    },
    select: {
      id: true,
      company: true,
      role: true,
      followUpDate: true,
    },
    orderBy: { followUpDate: "asc" },
  });
}

export async function getOverdueCount(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return prisma.application.count({
    where: {
      userId,
      followUpDate: { lte: today },
      status: { in: ["APPLIED", "SCREENING"] },
    },
  });
}

export interface CalendarItem {
  id: string;
  type: "follow_up" | "event";
  date: string; // YYYY-MM-DD
  startAt?: string; // ISO string (UTC) - used by calendar/ICS export
  endAt?: string; // ISO string (UTC) - used by calendar/ICS export
  title: string;
  subtitle?: string;
  applicationId: string;
  status: string;
  eventType?: string;
}

export async function getCalendarItems(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<CalendarItem[]> {
  const start = startOfLocalDay(startDate);
  const end = endOfLocalDay(endDate);

  const [appsWithFollowUp, events] = await Promise.all([
    prisma.application.findMany({
      where: {
        userId,
        followUpDate: { gte: start, lte: end },
      },
      select: {
        id: true,
        company: true,
        role: true,
        status: true,
        followUpDate: true,
      },
    }),
    prisma.event.findMany({
      where: {
        scheduledAt: { gte: start, lte: end },
        application: { userId },
      },
      include: {
        application: { select: { id: true, company: true, role: true, status: true } },
      },
    }),
  ]);

  const items: CalendarItem[] = [];

  for (const app of appsWithFollowUp) {
    if (!app.followUpDate) continue;
    items.push({
      id: `follow-${app.id}`,
      type: "follow_up",
      date: toYMDLocal(app.followUpDate),
      title: `Follow up: ${app.company}`,
      subtitle: app.role,
      applicationId: app.id,
      status: app.status,
      startAt: new Date(
        app.followUpDate.getFullYear(),
        app.followUpDate.getMonth(),
        app.followUpDate.getDate(),
        9,
        0,
        0,
        0
      ).toISOString(),
      endAt: new Date(
        app.followUpDate.getFullYear(),
        app.followUpDate.getMonth(),
        app.followUpDate.getDate(),
        10,
        0,
        0,
        0
      ).toISOString(),
    });
  }

  for (const event of events) {
    if (!event.application) continue;
    const app = event.application;
    const eventLabel =
      (event.type && EVENT_LABELS[event.type as keyof typeof EVENT_LABELS]) ?? event.type ?? "Event";
    items.push({
      id: event.id,
      type: "event",
      date: toYMDLocal(event.scheduledAt),
      title: `${eventLabel}: ${app.company}`,
      subtitle: app.role,
      applicationId: app.id,
      status: app.status,
      eventType: event.type,
      startAt: event.scheduledAt.toISOString(),
      // Default duration: 1 hour
      endAt: new Date(event.scheduledAt.getTime() + 60 * 60 * 1000).toISOString(),
    });
  }

  return items.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
}
