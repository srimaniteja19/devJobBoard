import { prisma } from "@/lib/db";
import type { AppStatus } from "@/types";

export async function getUserApplications(userId: string) {
  return prisma.application.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getApplicationById(id: string, userId: string) {
  return prisma.application.findFirst({
    where: { id, userId },
    include: {
      contacts: true,
      events: { orderBy: { scheduledAt: "desc" } },
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
    const key = weekStart.toISOString().slice(0, 10);
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
    const diff = (a.updatedAt.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);
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

  // Daily activity for heatmap
  const dailyActivity: Record<string, number> = {};
  for (const a of apps) {
    const key = a.createdAt.toISOString().slice(0, 10);
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
