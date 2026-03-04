import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticatedAction } from "@/lib/api-auth";
import { generateJson } from "@/lib/gemini";

function parseStack(stack: string): string[] {
  try {
    const arr = JSON.parse(stack);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { user, unauthorized } = await authenticatedAction();
  if (unauthorized) return unauthorized;

  const match = await prisma.resumeMatch.findFirst({
    where: {
      applicationId: params.id,
      application: { userId: user.id },
    },
  });

  if (!match) {
    return NextResponse.json({ error: "No match analysis" }, { status: 404 });
  }

  let result: unknown;
  try {
    result = JSON.parse(match.result);
  } catch {
    result = {};
  }

  return NextResponse.json(result);
}

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { user, unauthorized } = await authenticatedAction();
  if (unauthorized) return unauthorized;

  try {
    const app = await prisma.application.findFirst({
      where: { id: params.id, userId: user.id },
      select: {
        role: true,
        company: true,
        stack: true,
        notes: true,
        resumeText: true,
      },
    });

    if (!app) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const resumeText = app.resumeText?.trim();
    const notes = (app.notes ?? "").trim();

    if (!resumeText) {
      return NextResponse.json(
        { error: "No resume text. Upload a resume (PDF, DOCX, TXT) first." },
        { status: 400 },
      );
    }

    if (!notes) {
      return NextResponse.json(
        { error: "Add job description or notes to compare against." },
        { status: 400 },
      );
    }

    const stack = parseStack(app.stack);
    const stackStr = stack.length > 0 ? stack.join(", ") : "not specified";

    const systemInstruction = `You are an expert ATS system and senior technical recruiter. Analyze the resume against the job description with brutal honesty. Return ONLY valid JSON. No markdown, no backticks, no explanation.`;

    const userInput = `Job Title: ${app.role}
Company: ${app.company}
Tech Stack Required: ${stackStr}
Job Description / Notes:
${notes}

Candidate Resume:
${resumeText.slice(0, 12000)}

Perform a complete resume-JD match analysis and return this exact JSON structure (all fields required; use empty arrays/strings where needed):
{
  "overallScore": number,
  "atsScore": number,
  "scoreBreakdown": {
    "skillsMatch": number,
    "experienceMatch": number,
    "educationMatch": number,
    "keywordDensity": number,
    "formatScore": number
  },
  "verdict": "STRONG MATCH" | "GOOD MATCH" | "PARTIAL MATCH" | "WEAK MATCH" | "NOT RECOMMENDED",
  "verdictReason": "string",
  "keywordAnalysis": {
    "present": [{"keyword": "string", "frequency": number, "importance": "critical" | "important" | "nice-to-have"}],
    "missing": [{"keyword": "string", "importance": "critical" | "important" | "nice-to-have", "whereToAdd": "string", "suggestedPhrase": "string"}],
    "overused": [{"keyword": "string", "count": number, "suggestion": "string"}]
  },
  "sectionAnalysis": {
    "summary": {"score": number, "feedback": "string", "rewrite": "string"},
    "experience": {"score": number, "feedback": "string", "bulletImprovements": [{"original": "string", "improved": "string", "reason": "string"}]},
    "skills": {"score": number, "toAdd": ["string"], "toRemove": ["string"], "toReorder": "string"},
    "education": {"score": number, "feedback": "string"},
    "projects": {"score": number, "feedback": "string", "mostRelevant": ["string"], "toRemove": ["string"]}
  },
  "criticalIssues": [{"issue": "string", "impact": "high" | "medium", "fix": "string"}],
  "quickWins": [{"action": "string", "effort": "low" | "medium", "impact": "high" | "medium", "timeToFix": "string"}],
  "formattingIssues": [{"issue": "string", "fix": "string"}],
  "tailoredSummary": "string",
  "hiringManagerPerspective": "string",
  "competitiveEdge": "string",
  "estimatedInterviewChance": number,
  "estimatedChanceAfterFix": number
}`;

    const content = await generateJson(systemInstruction, userInput);
    const result =
      typeof content === "object" ? content : JSON.parse(String(content));
    const resultStr = JSON.stringify(result);

    const overallScore = Number(result?.overallScore ?? 0);
    const atsScore = Number(result?.atsScore ?? 0);

    await prisma.resumeMatch.upsert({
      where: { applicationId: params.id },
      create: {
        applicationId: params.id,
        overallScore,
        atsScore,
        result: resultStr,
      },
      update: {
        overallScore,
        atsScore,
        result: resultStr,
      },
    });

    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal error";
    const detail = e instanceof Error ? e.stack : String(e);
    console.error("Resume match error:", msg, detail);

    if (msg.includes("not configured")) {
      return NextResponse.json(
        { error: "GOOGLE_GENERATIVE_AI_API_KEY not configured" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        error: "Analysis failed. Please try again.",
        details: process.env.NODE_ENV === "development" ? detail : undefined,
      },
      { status: 500 },
    );
  }
}
