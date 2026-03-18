import { prisma } from "@/lib/db";
import { DEFAULT_REPORT_TIME_ZONE, startOfTimeZoneDay, getTimeZoneDateYMD } from "@/lib/timezone";

async function main() {
  const now = new Date(process.env.DAILY_REPORT_PREVIEW_END_ISO ?? new Date().toISOString());
  const reportDateYMD = getTimeZoneDateYMD(now, DEFAULT_REPORT_TIME_ZONE);
  const reportStart = startOfTimeZoneDay(now, DEFAULT_REPORT_TIME_ZONE);
  const reportEnd = now;
  const last24hStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const utcTodayStart = new Date(now);
  utcTodayStart.setUTCHours(0, 0, 0, 0);

  const setting = await prisma.dailyReportEmailSetting.findFirst({
    where: { enabled: true },
    select: { userId: true },
  });
  // If provided, use the user whose recipients include this email.
  const toEmail = process.env.DAILY_REPORT_PREVIEW_TO_EMAIL?.trim().toLowerCase();
  let userId: string | null = setting?.userId ?? null;
  if (toEmail) {
    const matching = await prisma.dailyReportEmailSetting.findMany({
      where: { enabled: true },
      select: { userId: true, recipientEmails: true },
    });
    const found = matching.find((s) =>
      (s.recipientEmails ?? "").split(/[,\n;\r\t ]+/g).some((e) => e.trim().toLowerCase() === toEmail)
    );
    userId = found?.userId ?? null;
  }

  if (!userId) {
    // eslint-disable-next-line no-console
    console.log("No enabled dailyReportEmailSetting found for preview.");
    process.exit(0);
  }

  const applied = await prisma.application.findMany({
    where: {
      userId,
      status: "APPLIED",
      appliedAt: { gte: reportStart, lt: reportEnd },
    },
    select: { id: true, company: true, role: true, appliedAt: true },
  });

  const distinctCompanyRole = new Set(
    applied.map((a) => `${a.company}__${a.role}`)
  );

  const appliedLast24h = await prisma.application.count({
    where: {
      userId,
      status: "APPLIED",
      appliedAt: { gte: last24hStart, lt: reportEnd },
    },
  });

  const appliedByUTCTodayStart = await prisma.application.count({
    where: {
      userId,
      status: "APPLIED",
      appliedAt: { gte: utcTodayStart, lt: reportEnd },
    },
  });

  const appliedByCreatedAt = await prisma.application.count({
    where: {
      userId,
      status: "APPLIED",
      createdAt: { gte: reportStart, lt: reportEnd },
    },
  });

  const appliedTransitions = await prisma.applicationStatusHistory.findMany({
    where: {
      application: { userId },
      toStatus: "APPLIED",
      changedAt: { gte: reportStart, lt: reportEnd },
    },
    select: { applicationId: true, toStatus: true, changedAt: true },
  });

  const appliedFromExtension = await prisma.application.count({
    where: {
      userId,
      status: "APPLIED",
      source: "extension",
      appliedAt: { gte: reportStart, lt: reportEnd },
    },
  });

  const appliedFromManual = await prisma.application.count({
    where: {
      userId,
      status: "APPLIED",
      source: "manual",
      appliedAt: { gte: reportStart, lt: reportEnd },
    },
  });

  const rejectedHistory = await prisma.applicationStatusHistory.findMany({
    where: {
      application: { userId },
      toStatus: "REJECTED",
      changedAt: { gte: reportStart, lt: reportEnd },
    },
    select: { applicationId: true, toStatus: true },
  });

  // eslint-disable-next-line no-console
  console.log({
    reportDateYMD,
    reportStart: reportStart.toISOString(),
    reportEnd: reportEnd.toISOString(),
    appliedCountByAppliedAt: applied.length,
    appliedDistinctCompanyRoleCount: distinctCompanyRole.size,
    appliedCountLast24h: appliedLast24h,
    appliedCountByUTCTodayStart: appliedByUTCTodayStart,
    appliedCountByCreatedAt: appliedByCreatedAt,
    appliedCountByStatusHistoryTransitions: appliedTransitions.length,
    appliedCountBySource: {
      extension: appliedFromExtension,
      manual: appliedFromManual,
    },
    rejectedTransitionsCount: rejectedHistory.length,
    sampleApplied: applied.slice(0, 10).map((a) => ({ company: a.company, role: a.role })),
  });
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});

