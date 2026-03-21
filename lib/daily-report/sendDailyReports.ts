import { Resend } from "resend";
import { prisma } from "@/lib/db";
import { DEFAULT_REPORT_TIME_ZONE, formatInTimeZone, getTimeZoneDateYMD, startOfTimeZoneDay } from "@/lib/timezone";
import { renderDailyReportEmailHtml, type DailyReportEmailData } from "./renderDailyReportEmail";
import { EVENT_LABELS, type AppStatus } from "@/types";
import { PREP_SECTIONS_BY_STAGE } from "@/lib/prep-config";
import { generateJson, isGeminiConfigured } from "@/lib/gemini";

function parseEmailList(input: string): string[] {
  const parts = input
    .split(/[,\n;\r\t ]+/g)
    .map((s) => s.trim())
    .filter(Boolean);

  // Very light validation (Resend will still validate).
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const out: string[] = [];
  const seen = new Set<string>();
  for (const p of parts) {
    if (!re.test(p)) continue;
    if (seen.has(p)) continue;
    seen.add(p);
    out.push(p);
  }
  return out;
}

async function maybeGenerateCoachNote(report: {
  reportDateYMD: string;
  appliedCount: number;
  rejectedCount: number;
  movedCounts: Record<string, number>;
  followUpCount: number;
  scheduledEventCount: number;
}) {
  if (!isGeminiConfigured()) return null;

  const SYSTEM = `You are a concise career coach.
Return a JSON object with:
{
  "title": "short title",
  "paragraphs": ["2-3 short paragraphs max"],
  "bullets": ["5 short, actionable bullets for the next 24 hours"]
}
Use a supportive, minimal tone. No markdown. Output valid JSON only.`;

  const userInput = `Here are today's job-application stats (ET):
- Applied: ${report.appliedCount}
- Rejected: ${report.rejectedCount}
- Moved: ${Object.entries(report.movedCounts)
      .map(([k, v]) => `${k}=${v}`)
      .join(", ")}
- Follow-up items in next window: ${report.followUpCount}
- Scheduled events in next window: ${report.scheduledEventCount}

Write the coach note for the user for the next 24 hours.`;

  try {
    const result = (await generateJson(SYSTEM, userInput)) as {
      title?: string;
      paragraphs?: string[];
      bullets?: string[];
    };
    return {
      coachTitle: result.title ?? undefined,
      coachParagraphs: result.paragraphs ?? undefined,
      coachBullets: result.bullets ?? undefined,
    };
  } catch {
    return null;
  }
}

async function getDailyReportEmailDataForUser(userId: string, reportDateYMD: string, window: { reportStart: Date; reportEnd: Date; nextStart: Date; nextEnd: Date }) {
  const setting = await prisma.dailyReportEmailSetting.findUnique({ where: { userId } });
  if (!setting?.enabled) return null;
  const toEmails = parseEmailList(setting.recipientEmails ?? "");
  if (!toEmails.length) return null;

  const movedStages = ["SCREENING", "INTERVIEW", "OFFER"] as const;
  const activityToStatuses = ["APPLIED", "REJECTED", ...movedStages];

  const statusHistory = await prisma.applicationStatusHistory.findMany({
    where: {
      changedAt: { gte: window.reportStart, lt: window.reportEnd },
      application: { userId },
      toStatus: { in: activityToStatuses as unknown as string[] },
    },
    select: {
      toStatus: true,
      application: { select: { id: true, company: true, role: true } },
    },
    orderBy: { changedAt: "asc" },
  });

  const distinctById = <T extends { id: string }>(items: (T & Record<string, unknown>)[]) => {
    const byId: Record<string, T> = {};
    for (const it of items) {
      byId[it.id] = it as T;
    }
    return Object.values(byId);
  };

  // "Applied today" must use `Application.appliedAt` (status history can be missing
  // for apps created via the extension).
  const appliedApps = await prisma.application.findMany({
    where: {
      userId,
      status: "APPLIED",
      appliedAt: { gte: window.reportStart, lt: window.reportEnd },
    },
    select: { company: true, role: true, id: true, appliedAt: true },
  });

  const appliedDistinct = distinctById(
    appliedApps.map((a) => ({ id: a.id, company: a.company, role: a.role, appliedAt: a.appliedAt }))
  ).map(({ company, role, appliedAt }) => ({
    company,
    role,
    appliedAtISO: appliedAt
      ? formatInTimeZone(appliedAt, DEFAULT_REPORT_TIME_ZONE, {
          year: "numeric",
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      : "",
  }));

  const rejectedApps = distinctById(
    statusHistory
      .filter((h) => h.toStatus === "REJECTED")
      .map((h) => ({ id: h.application.id, company: h.application.company, role: h.application.role }))
  ).map(({ company, role }) => ({ company, role }));

  const moved: Record<string, { company: string; role: string }[]> = {};
  for (const stage of movedStages) {
    const appsForStage = distinctById(
      statusHistory
        .filter((h) => h.toStatus === stage)
        .map((h) => ({ id: h.application.id, company: h.application.company, role: h.application.role }))
    ).map(({ company, role }) => ({ company, role }));
    moved[stage] = appsForStage;
  }

  const followUps = await prisma.application.findMany({
    where: {
      userId,
      followUpDate: { gte: window.nextStart, lte: window.nextEnd },
    },
    select: {
      id: true,
      company: true,
      role: true,
      status: true,
      followUpDate: true,
    },
  });

  const followUpAppIds = followUps.map((a) => a.id);
  const prepsByApp = new Map<string, { stage: string; sectionKey: string; content: string }[]>();

  if (followUpAppIds.length) {
    const preps = await prisma.applicationPrep.findMany({
      where: { applicationId: { in: followUpAppIds } },
      select: { applicationId: true, stage: true, sectionKey: true, content: true },
    });
    for (const p of preps) {
      const arr = prepsByApp.get(p.applicationId) ?? [];
      arr.push({ stage: p.stage, sectionKey: p.sectionKey, content: p.content });
      prepsByApp.set(p.applicationId, arr);
    }
  }

  const followUpItems = followUps
    .sort((a, b) => (a.followUpDate?.getTime() ?? 0) - (b.followUpDate?.getTime() ?? 0))
    .map((a) => {
      const status = a.status as AppStatus;
      const configs = PREP_SECTIONS_BY_STAGE[status] ?? [];
      const preps = (prepsByApp.get(a.id) ?? []).filter((p) => p.stage === a.status);
      const generatedSectionLabels = configs
        .filter((cfg) => preps.some((p) => p.sectionKey === cfg.key && String(p.content ?? "").trim().length > 0))
        .map((cfg) => cfg.label);

      return {
        company: a.company,
        role: a.role,
        dueAtISO: a.followUpDate
          ? formatInTimeZone(a.followUpDate, DEFAULT_REPORT_TIME_ZONE, {
              year: "numeric",
              month: "short",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })
          : "",
        status: a.status,
        prepSectionLabels: generatedSectionLabels,
      };
    });

  const scheduled = await prisma.event.findMany({
    where: {
      application: { userId },
      scheduledAt: { gte: window.nextStart, lte: window.nextEnd },
    },
    include: { application: { select: { id: true, company: true, role: true, status: true } } },
    orderBy: { scheduledAt: "asc" },
  });

  const scheduledAppIds: string[] = [];
  const scheduledAppSeen = new Set<string>();
  for (const e of scheduled) {
    const id = e.application.id;
    if (scheduledAppSeen.has(id)) continue;
    scheduledAppSeen.add(id);
    scheduledAppIds.push(id);
  }
  const prepsByScheduledApp = new Map<string, { stage: string; sectionKey: string; content: string }[]>();

  if (scheduledAppIds.length) {
    const preps = await prisma.applicationPrep.findMany({
      where: { applicationId: { in: scheduledAppIds } },
      select: { applicationId: true, stage: true, sectionKey: true, content: true },
    });
    for (const p of preps) {
      const arr = prepsByScheduledApp.get(p.applicationId) ?? [];
      arr.push({ stage: p.stage, sectionKey: p.sectionKey, content: p.content });
      prepsByScheduledApp.set(p.applicationId, arr);
    }
  }

  const scheduledEvents = scheduled.map((e) => {
    const label = (e.type && EVENT_LABELS[e.type as keyof typeof EVENT_LABELS]) ?? e.type ?? "Other";
    const scheduledAtISO = formatInTimeZone(e.scheduledAt, DEFAULT_REPORT_TIME_ZONE, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const status = e.application.status as AppStatus;
    const configs = PREP_SECTIONS_BY_STAGE[status] ?? [];
    const preps = (prepsByScheduledApp.get(e.application.id) ?? []).filter((p) => p.stage === e.application.status);
    const prepSectionLabels = configs
      .filter((cfg) => preps.some((p) => p.sectionKey === cfg.key && String(p.content ?? "").trim().length > 0))
      .map((cfg) => cfg.label);

    return {
      company: e.application.company,
      role: e.application.role,
      scheduledAtISO,
      eventLabel: label,
      notes: e.notes,
      status: e.application.status,
      prepSectionLabels,
    };
  });

  const reportForCoach = {
    reportDateYMD,
    appliedCount: appliedDistinct.length,
    rejectedCount: rejectedApps.length,
    movedCounts: Object.fromEntries(Object.entries(moved).map(([k, v]) => [k, v.length])),
    followUpCount: followUpItems.length,
    scheduledEventCount: scheduledEvents.length,
  };

  const coach = await maybeGenerateCoachNote(reportForCoach);

  const data: DailyReportEmailData = {
    reportDateYMD,
    generatedAtISO: new Date().toISOString(),
    applied: appliedDistinct,
    rejected: rejectedApps,
    moved,
    followUps: followUpItems,
    scheduledEvents,
    coachTitle: coach?.coachTitle,
    coachParagraphs: coach?.coachParagraphs,
    coachBullets: coach?.coachBullets,
  };

  return data;
}

export async function sendDailyReportsForNow(): Promise<{ attempted: number; sent: number; failed: number }> {
  const reportTimeZone = DEFAULT_REPORT_TIME_ZONE;
  const now = new Date();
  const reportDateYMD = getTimeZoneDateYMD(now, reportTimeZone);

  // Same calendar day as the dashboard: midnight in the report timezone (ET), not UTC.
  const reportStart = startOfTimeZoneDay(now, reportTimeZone);
  const reportEnd = now;

  // "Next window" starting immediately after the email time.
  const nextStart = now;
  const nextEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const window = { reportStart, reportEnd, nextStart, nextEnd };

  const settings = await prisma.dailyReportEmailSetting.findMany({
    where: { enabled: true },
    select: { userId: true, recipientEmails: true },
  });

  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.DAILY_REPORT_FROM_EMAIL;
  const fromName = process.env.DAILY_REPORT_FROM_NAME ?? "Dev Job Board";
  const subjectPrefix = process.env.DAILY_REPORT_SUBJECT_PREFIX ?? "Daily Job Board Report";

  if (!resendApiKey || !fromEmail) {
    throw new Error("Missing RESEND_API_KEY and/or DAILY_REPORT_FROM_EMAIL env vars");
  }

  const resend = new Resend(resendApiKey);

  let attempted = 0;
  let sent = 0;
  let failed = 0;

  for (const s of settings) {
    const userId = s.userId;
    const setting = await prisma.dailyReportEmailSetting.findUnique({ where: { userId }, select: { userId: true, recipientEmails: true, enabled: true } });
    if (!setting?.enabled) continue;

    const toEmails = parseEmailList(setting.recipientEmails ?? "");
    if (!toEmails.length) continue;

    // Idempotency: one delivery record per user per reportDate.
    const existing = await prisma.dailyReportDelivery.findUnique({
      where: { userId_reportDate: { userId, reportDate: reportDateYMD } },
      select: { id: true },
    });
    if (existing) continue;

    await prisma.dailyReportDelivery.create({
      data: {
        userId,
        reportDate: reportDateYMD,
        status: "SENDING",
        toEmails: toEmails.join(","),
        sentAt: null,
        error: null,
      },
    });
    attempted++;

    try {
      const data = await getDailyReportEmailDataForUser(userId, reportDateYMD, window);
      if (!data) {
        await prisma.dailyReportDelivery.update({
          where: { userId_reportDate: { userId, reportDate: reportDateYMD } },
          data: { status: "FAILED", error: "No enabled recipients found", sentAt: null },
        });
        failed++;
        continue;
      }

      const { html, text } = renderDailyReportEmailHtml(data);
      const subject = `${subjectPrefix} — ${reportDateYMD} (ET)`;

      await resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: toEmails,
        subject,
        html,
        text,
      });

      await prisma.dailyReportDelivery.update({
        where: { userId_reportDate: { userId, reportDate: reportDateYMD } },
        data: { status: "SENT", sentAt: new Date(), error: null },
      });
      sent++;
    } catch (e) {
      failed++;
      const message = e instanceof Error ? e.message : String(e);
      await prisma.dailyReportDelivery.update({
        where: { userId_reportDate: { userId, reportDate: reportDateYMD } },
        data: { status: "FAILED", error: message, sentAt: null },
      });
    }
  }

  return { attempted, sent, failed };
}

