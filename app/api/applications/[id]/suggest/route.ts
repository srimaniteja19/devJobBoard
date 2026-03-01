import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/db";
import { authenticatedAction } from "@/lib/api-auth";
import type { SuggestedJob } from "@/types";

const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GEMINI_API_KEY;

interface ExtractedContext {
  company: string;
  baseRole: string;
  seniority: string;
  coreSkills: string[];
  department: string;
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

    const extractText = extractRes.response.text();
    if (!extractText) {
      return NextResponse.json({ jobs: [], error: "parse_failed" }, { status: 200 });
    }

    let ctx: ExtractedContext;
    try {
      ctx = parseJsonFromText(extractText) as ExtractedContext;
    } catch {
      return NextResponse.json({ jobs: [], error: "parse_failed" }, { status: 200 });
    }

    // Step 2: Search for jobs with Google Search grounding
    // Note: responseMimeType omitted when using tools - can cause conflicts
    const searchModel = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      // API expects google_search (not googleSearchRetrieval) for Gemini 2.x
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tools: [{ google_search: {} }] as any,
      systemInstruction:
        "You are a job search assistant. Search for currently open job positions and return results as a JSON array only. No markdown, no explanation, no code fence, just the raw JSON array.",
    });

    const searchPrompt = `Search for currently open ${ctx.seniority || ""} ${ctx.baseRole} and similar ${ctx.department || "Engineering"} roles at ${ctx.company} in the United States in 2025. Look for positions similar to someone with skills in ${(ctx.coreSkills || []).join(", ") || "software development"}.

Return a JSON array of up to 6 jobs, each with:
{
  "title": string,
  "company": string,
  "location": string,
  "url": string,
  "matchReason": string,
  "postedRecency": string
}
- location: city/state or "Remote - USA"
- url: direct apply link if found, else careers page
- matchReason: one sentence why this is similar (max 12 words)
- postedRecency: e.g. "Posted 3 days ago" or "Recently posted"
Only include jobs located in the United States. Only include roles genuinely similar in seniority and skill set. Return only the JSON array, nothing else.`;

    const searchRes = await searchModel.generateContent(searchPrompt);

    const searchText = searchRes.response.text();
    if (!searchText) {
      return NextResponse.json({
        jobs: [],
        extractedContext: { baseRole: ctx.baseRole, coreSkills: ctx.coreSkills || [] },
        error: "no_results",
      });
    }

    let rawJobs: unknown[];
    try {
      const parsed = parseJsonFromText(searchText);
      rawJobs = Array.isArray(parsed) ? parsed : [];
    } catch {
      return NextResponse.json({
        jobs: [],
        extractedContext: { baseRole: ctx.baseRole, coreSkills: ctx.coreSkills || [] },
        error: "parse_failed",
      });
    }

    const usaPattern = /usa|united states|remote|us\b|california|new york|texas|washington/i;
    const jobs: SuggestedJob[] = rawJobs
      .filter((j): j is Record<string, unknown> => typeof j === "object" && j !== null)
      .map((j) => ({
        title: String(j.title ?? ""),
        company: String(j.company ?? ctx.company),
        location: String(j.location ?? "USA"),
        url: String(j.url ?? ""),
        matchReason: String(j.matchReason ?? "Similar role"),
        postedRecency: String(j.postedRecency ?? "Recently posted"),
      }))
      .filter(
        (j) =>
          j.url &&
          (usaPattern.test(j.location) || usaPattern.test(j.company) || j.location.toLowerCase().includes("remote"))
      );

    return NextResponse.json({
      jobs,
      extractedContext: { baseRole: ctx.baseRole, coreSkills: ctx.coreSkills || [] },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal error";
    const detail = e instanceof Error ? e.stack : String(e);
    console.error("Suggest similar jobs error:", msg, detail);
    return NextResponse.json(
      { error: msg, details: process.env.NODE_ENV === "development" ? detail : undefined },
      { status: 500 }
    );
  }
}
