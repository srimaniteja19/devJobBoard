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

  // Average days to first response (applied → screening+)
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

  // Top companies
  const companyCounts: Record<string, number> = {};
  for (const a of apps) {
    companyCounts[a.company] = (companyCounts[a.company] || 0) + 1;
  }
  const topCompanies = Object.entries(companyCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Top stacks
  const stackCounts: Record<string, number> = {};
  for (const a of apps) {
    try {
      const tags: string[] = JSON.parse(a.stack);
      for (const t of tags) stackCounts[t] = (stackCounts[t] || 0) + 1;
    } catch {}
  }
  const topStacks = Object.entries(stackCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  return {
    responseRate,
    interviewConversion,
    avgDaysToResponse,
    topCompanies,
    topStacks,
  };
}
