import { Resend } from "resend";
import { prisma } from "@/lib/db";
import {
  addCalendarDaysYMD,
  DEFAULT_REPORT_TIME_ZONE,
  formatInTimeZone,
  getTimeZoneDateYMD,
  startOfTimeZoneDay,
  startOfTimeZoneDayFromYMD,
} from "@/lib/timezone";
import { renderDailyReportEmailHtml, type DailyReportEmailData } from "./renderDailyReportEmail";
import { EVENT_LABELS, type AppStatus } from "@/types";
import { PREP_SECTIONS_BY_STAGE } from "@/lib/prep-config";
import { generateJson, isGeminiConfigured } from "@/lib/gemini";

/** Notable/stretch companies for highlighting in the applied table and company-of-day selection. */
const STRETCH_COMPANIES = new Set([
  "google", "meta", "facebook", "amazon", "apple", "microsoft", "netflix", "openai", "anthropic",
  "stripe", "figma", "notion", "linear", "vercel", "github", "spotify", "airbnb", "uber", "lyft",
  "salesforce", "adobe", "nvidia", "tesla", "coinbase", "square", "block", "twilio", "databricks",
  "snowflake", "mongodb", "elastic", "atlassian", "slack", "zoom", "dropbox", "box", "palantir",
].map((s) => s.toLowerCase()));

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

  const SYSTEM = `You are a concise career coach. Dry wit preferred. No platitudes.
Return a JSON object with:
{
  "title": "short title",
  "paragraphs": ["2-3 short paragraphs max"],
  "bullets": ["5 short, actionable bullets for the next 24 hours"]
}
Output valid JSON only. No markdown.`;

  const userInput = `Stats (ET): Applied ${report.appliedCount}, Rejected ${report.rejectedCount}, Moved ${Object.entries(report.movedCounts).map(([k, v]) => `${k}=${v}`).join(", ")}, Follow-ups ${report.followUpCount}, Events ${report.scheduledEventCount}. Coach note for next 24h.`;

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

async function maybeGeneratePullQuote(report: {
  appliedCount: number;
  rejectedCount: number;
  pendingCount: number;
}) {
  if (!isGeminiConfigured()) return null;

  const SYSTEM = `You write dry, sardonic one-liners about job application stats.
Return JSON: { "lines": ["line1", "line2", "line3"] }
Format: 3 lines — (1) action taken, (2) outcome/reaction, (3) sardonic punchline.
Example: "Sent 28 applications." / "Received 5 rejections." / "23 companies are still considering their feelings."
Keep each line under 60 chars. Output valid JSON only.`;

  const userInput = `Applied: ${report.appliedCount}, Rejected: ${report.rejectedCount}, Pending (no response yet): ${report.pendingCount}. Write 3-line pull quote.`;

  try {
    const result = (await generateJson(SYSTEM, userInput)) as { lines?: string[] };
    const lines = result.lines?.filter((l) => typeof l === "string" && l.length > 0) ?? [];
    return lines.length >= 3 ? lines.slice(0, 3).join(" / ") : null;
  } catch {
    return null;
  }
}

async function maybeGenerateRejectionAnalysis(rejections: { company: string; role: string }[]) {
  if (!isGeminiConfigured() || rejections.length === 0) return null;

  const SYSTEM = `Analyze job rejections. Return JSON:
{
  "items": [{ "company": "...", "role": "...", "signal": "stack"|"domain"|"generic" }],
  "patterns": [{ "dot": "red"|"gold"|"neutral", "body": "one short sentence" }]
}
Signal: stack = language/tech mismatch, domain = keyword/domain miss, generic = unclear.
Dot: red = stack issue, gold = domain issue, neutral = recommendation.
Max 3 patterns. Last pattern must be neutral (recommendation). Output valid JSON only.`;

  const userInput = `Rejections: ${JSON.stringify(rejections.slice(0, 10))}. Analyze and return items+patterns.`;

  try {
    const result = (await generateJson(SYSTEM, userInput)) as {
      items?: { company: string; role: string; signal: string }[];
      patterns?: { dot: string; body: string }[];
    };
    const items = (result.items ?? []).slice(0, rejections.length).map((it) => ({
      company: it.company ?? "",
      role: it.role ?? "",
      signal: (it.signal === "stack" || it.signal === "domain" || it.signal === "generic" ? it.signal : "generic") as "stack" | "domain" | "generic",
    }));
    const patterns = (result.patterns ?? []).slice(0, 3).map((p) => ({
      dot: (p.dot === "red" || p.dot === "gold" || p.dot === "neutral" ? p.dot : "neutral") as "red" | "gold" | "neutral",
      body: String(p.body ?? ""),
    }));
    if (patterns.length > 0 && patterns[patterns.length - 1].dot !== "neutral") {
      patterns[patterns.length - 1] = { dot: "neutral", body: patterns[patterns.length - 1].body };
    }
    return { items, patterns };
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

  // 7-day sparkline: applied counts per day (report timezone)
  const sparklineData: { day: string; label: string; count: number }[] = [];
  const tz = DEFAULT_REPORT_TIME_ZONE;
  const dayAbbrs = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  let weeklyTotal = 0;
  for (let i = 6; i >= 0; i--) {
    const ymd = addCalendarDaysYMD(reportDateYMD, -i);
    const dayStart = startOfTimeZoneDayFromYMD(ymd, tz);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
    const dayNum = parseInt(ymd.slice(8, 10), 10);
    const dayOfWeek = new Date(dayStart.getTime() + 12 * 60 * 60 * 1000).getDay();
    const count = await prisma.application.count({
      where: {
        userId,
        status: "APPLIED",
        appliedAt: { gte: dayStart, lte: dayEnd },
      },
    });
    weeklyTotal += count;
    sparklineData.push({
      day: ymd,
      label: `${dayAbbrs[dayOfWeek]} ${dayNum}`,
      count,
    });
  }

  // Company of the day: first stretch company from applied, else first applied
  const isStretch = (company: string) =>
    STRETCH_COMPANIES.has(company.trim().toLowerCase());
  const stretchFromApplied = appliedDistinct.find((a) => isStretch(a.company));
  const companyOfTheDay = (stretchFromApplied ?? appliedDistinct[0])
    ? {
        company: (stretchFromApplied ?? appliedDistinct[0]).company,
        role: (stretchFromApplied ?? appliedDistinct[0]).role,
        isStretch: !!stretchFromApplied,
      }
    : undefined;

  const pendingCount = Math.max(0, appliedDistinct.length - rejectedApps.length);
  const pullQuote = await maybeGeneratePullQuote({
    appliedCount: appliedDistinct.length,
    rejectedCount: rejectedApps.length,
    pendingCount,
  });

  const rejectionAnalysis = await maybeGenerateRejectionAnalysis(rejectedApps);

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
    pullQuote: pullQuote ?? undefined,
    sparklineData,
    weeklyTotal,
    companyOfTheDay,
    rejectionAnalysis: rejectionAnalysis ?? undefined,
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

