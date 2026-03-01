import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/db";
import { authenticatedAction } from "@/lib/api-auth";
import type { SuggestedJob } from "@/types";

const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GEMINI_API_KEY;

/** Only suggest jobs posted within the last 24 hours. */
const MIN_POSTED_HOURS = 0;
const MAX_POSTED_HOURS = 24;

/** Allowed job source domains: hiring.cafe, LinkedIn, Greenhouse, Ashby. */
function isAllowedJobUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return (
      host === "hiring.cafe" ||
      host.endsWith(".hiring.cafe") ||
      host === "linkedin.com" ||
      host.endsWith(".linkedin.com") ||
      host.endsWith("greenhouse.io") ||
      host.endsWith("ashbyhq.com")
    );
  } catch {
    return false;
  }
}

/** True if URL looks like the given company's own careers site (e.g. careers.tabot.com, tabot.com/jobs). */
function isCompanyCareersUrl(url: string, companyName: string): boolean {
  if (!companyName || companyName.length < 2) return false;
  try {
    const host = new URL(url).hostname.toLowerCase();
    const slug = companyName
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[^a-z0-9]/g, "");
    if (!slug || slug.length < 2) return false;
    return host.includes(slug);
  } catch {
    return false;
  }
}

function isAllowedSourceUrl(url: string, companyName: string): boolean {
  return isAllowedJobUrl(url) || isCompanyCareersUrl(url, companyName);
}

interface ExtractedContext {
  company: string;
  baseRole: string;
  seniority: string;
  coreSkills: string[];
  department: string;
}

interface RawJob {
  title?: unknown;
  company?: unknown;
  location?: unknown;
  url?: unknown;
  matchReason?: unknown;
  postedRecency?: unknown;
  /** Preferred: hours since post (0–24). Used for filtering. */
  postedHoursAgo?: unknown;
}

function parseStack(stack: string): string[] {
  try {
    const arr = JSON.parse(stack);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function parseJsonFromText(text: string): unknown {
  let s = text.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) s = fence[1].trim();
  return JSON.parse(s);
}

/** Parse postedRecency or postedHoursAgo into hours ago. Returns null if unparseable or outside 0–24h. */
function parsePostedHoursAgo(job: RawJob): number | null {
  const num = job.postedHoursAgo;
  if (typeof num === "number" && Number.isFinite(num) && num >= 0 && num <= MAX_POSTED_HOURS) {
    return num;
  }
  if (typeof num === "string") {
    const n = parseInt(num, 10);
    if (!Number.isNaN(n) && n >= 0 && n <= MAX_POSTED_HOURS) return n;
  }
  const recency = String(job.postedRecency ?? "").toLowerCase();
  if (!recency) return null;
  // Only allow last 24 hours: "today", "hours ago", "yesterday" (count as 24), "just now"
  if (/\b(just now|today|recently|hours? ago)\b/.test(recency)) {
    const hourMatch = recency.match(/(\d+)\s*hours?\s*ago/);
    if (hourMatch) {
      const h = parseInt(hourMatch[1], 10);
      return h <= MAX_POSTED_HOURS ? h : null;
    }
    if (/\b(today|just|recent)\b/.test(recency)) return 12; // assume recent
  }
  if (/\b(yesterday|1 day ago)\b/.test(recency)) return 24;
  const dayMatch = recency.match(/(\d+)\s*day/);
  if (dayMatch) {
    const days = parseInt(dayMatch[1], 10);
    if (days === 0) return 0;
    if (days === 1) return 24;
    return null; // 2+ days -> exclude
  }
  // "2 days", "week", "month" -> exclude
  if (/\b(2|3|4|5|6|7|\d{2,})\s*days?\b|week|month|expired\b/i.test(recency)) return null;
  return null;
}

function isValidUrl(s: string): boolean {
  if (!s || s.length < 10) return false;
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!API_KEY) {
    return NextResponse.json(
      { error: "GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY not configured" },
      { status: 500 }
    );
  }

  const { user, unauthorized } = await authenticatedAction();
  if (unauthorized) return unauthorized;

  try {
    const app = await prisma.application.findFirst({
      where: { id: params.id, userId: user.id },
    });
    if (!app) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const stack = parseStack(app.stack);
    const notes = (app.notes ?? "").slice(0, 500);
    const userInput = [
      app.role,
      app.company,
      stack.join(", "),
      notes,
    ]
      .filter(Boolean)
      .join("\n");

    const genAI = new GoogleGenerativeAI(API_KEY);

    // Step 1: Extract context (no search)
    let ctx: ExtractedContext;
    try {
      const extractModel = genAI.getGenerativeModel({
        model: "gemini-2.5-flash-lite",
        systemInstruction: `You are a job search assistant. Extract key information from a job application and return ONLY a JSON object with these fields:
{
  "company": string,
  "baseRole": string,
  "seniority": string,
  "coreSkills": string[],
  "department": string
}
- baseRole: e.g. "Software Engineer", "AI Engineer"
- seniority: e.g. "Senior", "Mid", "Junior", or "" if unclear
- coreSkills: top 4-5 skills from the JD
- department: e.g. "Engineering", "Data Science", "Product"
Return only valid JSON, no markdown, no explanation.`,
        generationConfig: { responseMimeType: "application/json" },
      });
      const extractRes = await extractModel.generateContent(userInput);
      const extractText = extractRes?.response?.text?.() ?? "";
      if (!extractText) {
        return NextResponse.json({
          jobs: [],
          error: "Could not extract job context. Try again.",
          errorCode: "parse_failed",
        }, { status: 200 });
      }
      ctx = parseJsonFromText(extractText) as ExtractedContext;
      if (!ctx?.baseRole || !ctx?.company) {
        return NextResponse.json({
          jobs: [],
          error: "Could not extract role or company. Check the application details.",
          errorCode: "parse_failed",
        }, { status: 200 });
      }
    } catch (extractErr) {
      const msg = extractErr instanceof Error ? extractErr.message : "Extract failed";
      console.error("Suggest jobs extract error:", msg);
      return NextResponse.json({
        jobs: [],
        error: "We couldn't analyze this application. Please try again.",
        errorCode: "parse_failed",
      }, { status: 200 });
    }

    // Step 2: Search for jobs with Google Search grounding
    let searchText: string;
    try {
      const searchModel = genAI.getGenerativeModel({
        model: "gemini-2.5-flash-lite",
        tools: [{ google_search: {} }] as unknown as { googleSearchRetrieval?: object }[],
        systemInstruction:
          "You are a job search assistant. Search for currently open job positions and return results as a JSON array only. No markdown, no explanation, no code fence, just the raw JSON array.",
      });

      const searchPrompt = `You are finding similar job openings in two ways. Return ONE combined JSON array.

PART 1 – Jobs at ${ctx.company} (user's company). Search in this order:
- First: ${ctx.company}'s official careers website (e.g. careers.${ctx.company.replace(/\s+/g, "").toLowerCase()}.com, ${ctx.company.replace(/\s+/g, "").toLowerCase()}.com/careers, ${ctx.company.replace(/\s+/g, "").toLowerCase()}.com/jobs). Include the direct job URL from their site.
- Then: Hiring Cafe (hiring.cafe), LinkedIn (linkedin.com/jobs), Greenhouse (*.greenhouse.io), Ashby (ashbyhq.com) when they list ${ctx.company} jobs. Use each platform's direct job link.

PART 2 – Similar roles at OTHER companies (not ${ctx.company}). Same type of role: ${ctx.seniority || ""} ${ctx.baseRole} in ${ctx.department || "Engineering"}, skills: ${(ctx.coreSkills || []).join(", ") || "software development"}. Search only:
- Hiring Cafe, LinkedIn Jobs, Greenhouse, Ashby. Include jobs from various other companies that match the role and skills. Each job url must be from one of these four sources only.

ALLOWED URL SOURCES (every job url must match one of these):
- ${ctx.company}'s own domain (careers page, jobs page)
- hiring.cafe
- linkedin.com
- greenhouse.io (any subdomain)
- ashbyhq.com

CRITICAL – Recency: Only jobs posted in the LAST 24 HOURS. postedHoursAgo 0–24 only. USA only.

Return a JSON array of up to 10 jobs (mix of ${ctx.company} jobs and similar roles at other companies), each with:
{
  "title": string,
  "company": string,
  "location": string,
  "url": string,
  "matchReason": string,
  "postedRecency": string,
  "postedHoursAgo": number
}
- url: direct apply link from one of the allowed sources above
- matchReason: e.g. "Same role at your company" or "Similar role at [Other Company]"
Return only the JSON array, nothing else.`;

      const searchRes = await searchModel.generateContent(searchPrompt);
      searchText = searchRes?.response?.text?.() ?? "";
    } catch (searchErr) {
      const msg = searchErr instanceof Error ? searchErr.message : "Search failed";
      console.error("Suggest jobs search error:", msg);
      return NextResponse.json({
        jobs: [],
        extractedContext: { baseRole: ctx.baseRole, coreSkills: ctx.coreSkills || [] },
        error: "Job search is temporarily unavailable. Please try again in a moment.",
        errorCode: "search_failed",
      }, { status: 200 });
    }

    if (!searchText) {
      return NextResponse.json({
        jobs: [],
        extractedContext: { baseRole: ctx.baseRole, coreSkills: ctx.coreSkills || [] },
        error: "no_results",
      });
    }

    let rawJobs: RawJob[];
    try {
      const parsed = parseJsonFromText(searchText);
      rawJobs = Array.isArray(parsed)
        ? parsed.filter((j): j is RawJob => typeof j === "object" && j !== null)
        : [];
    } catch {
      return NextResponse.json({
        jobs: [],
        extractedContext: { baseRole: ctx.baseRole, coreSkills: ctx.coreSkills || [] },
        error: "parse_failed",
      });
    }

    const usaPattern = /usa|united states|remote|us\b|california|new york|texas|washington/i;
    const jobs: SuggestedJob[] = rawJobs
      .filter((j) => {
        const url = String(j.url ?? "").trim();
        if (!url || !isValidUrl(url) || !isAllowedSourceUrl(url, ctx.company)) return false;
        const hoursAgo = parsePostedHoursAgo(j);
        if (hoursAgo === null) return false;
        if (hoursAgo < MIN_POSTED_HOURS || hoursAgo > MAX_POSTED_HOURS) return false;
        const loc = String(j.location ?? "").toLowerCase();
        const companyStr = String(j.company ?? "").toLowerCase();
        return usaPattern.test(loc) || usaPattern.test(companyStr) || loc.includes("remote");
      })
      .map((j) => ({
        title: String(j.title ?? "").trim() || "Similar role",
        company: String(j.company ?? ctx.company).trim(),
        location: String(j.location ?? "USA").trim(),
        url: String(j.url ?? "").trim(),
        matchReason: String(j.matchReason ?? "Similar role").trim(),
        postedRecency: String(j.postedRecency ?? "Recently posted").trim(),
      }))
      .slice(0, 10);

    if (jobs.length === 0) {
      return NextResponse.json({
        jobs: [],
        extractedContext: { baseRole: ctx.baseRole, coreSkills: ctx.coreSkills || [] },
        error: "No similar jobs in the last 24 hours from company careers sites, Hiring Cafe, LinkedIn, Greenhouse, or Ashby. Try again later.",
        errorCode: "no_results",
      });
    }

    return NextResponse.json({
      jobs,
      extractedContext: { baseRole: ctx.baseRole, coreSkills: ctx.coreSkills || [] },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal error";
    const detail = e instanceof Error ? e.stack : String(e);
    console.error("Suggest similar jobs error:", msg, detail);
    return NextResponse.json(
      {
        error: "Something went wrong while fetching suggestions. Please try again.",
        errorCode: "server_error",
        details: process.env.NODE_ENV === "development" ? detail : undefined,
      },
      { status: 500 }
    );
  }
}
