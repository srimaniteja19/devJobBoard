import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticatedAction } from "@/lib/api-auth";
import { generateJson } from "@/lib/gemini";
import { toYMDLocal } from "@/lib/date-helpers";

function parseStack(stack: string): string[] {
  try {
    const arr = JSON.parse(stack);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export interface BlindSpotInsight {
  type: string;
  title: string;
  detail: string;
}

export interface BlindSpotResult {
  insights: BlindSpotInsight[];
}

export async function POST() {
  const { user, unauthorized } = await authenticatedAction();
  if (unauthorized) return unauthorized;

  try {
    const apps = await prisma.application.findMany({
      where: { userId: user.id },
      select: {
        company: true,
        role: true,
        stack: true,
        salary: true,
        location: true,
        type: true,
        status: true,
        appliedAt: true,
        createdAt: true,
      },
    });

    if (apps.length === 0) {
      return NextResponse.json(
        {
          error:
            "No applications yet. Add some applications to run a blind spot analysis.",
        },
        { status: 400 },
      );
    }

    // Build a compact summary for Gemini (avoid token bloat)
    const summary = apps.map((a) => {
      const appliedDate = a.appliedAt ?? a.createdAt;
      const dayOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
        appliedDate.getDay()
      ];
      const stack = parseStack(a.stack);
      return {
        company: a.company,
        role: a.role,
        stack: stack.slice(0, 6),
        salary: a.salary ?? "(not listed)",
        location: a.location ?? a.type,
        status: a.status,
        appliedDay: dayOfWeek,
        appliedDate: toYMDLocal(appliedDate),
      };
    });

    const systemInstruction = `You are a job search strategist. Analyze a candidate's application data and identify blind spots — patterns they can't easily see themselves.

Return ONLY a valid JSON object:
{
  "insights": [
    {
      "type": "mismatch" | "underselling" | "timing" | "targeting" | "stack" | "salary" | "other",
      "title": "Short headline (e.g. 'Startup vs. enterprise mismatch')",
      "detail": "2-4 sentences explaining the pattern, evidence from their data, and actionable advice."
    }
  ]
}

Look for patterns like:
- Mismatch: e.g. applying to Series A startups but their experience skews enterprise (or vice versa)
- Underselling: roles seem below their level (infer seniority from titles)
- Timing: apply patterns (e.g. Fridays have lowest callback rate in their data)
- Targeting: too broad or too narrow company/role focus
- Stack: over/under-indexing on certain technologies vs. response rates
- Salary: patterns in listed salary ranges vs. role level

Be specific, evidence-based, and constructive. Return 3-7 insights. If data is too sparse, say so in fewer insights.`;

    const userInput = `Analyze this candidate's ${apps.length} job applications and identify blind spots:

${JSON.stringify(summary)}

Identify patterns, mismatches, underselling, timing issues, or targeting blind spots.`;

    const result = (await generateJson(
      systemInstruction,
      userInput,
    )) as BlindSpotResult;

    if (!Array.isArray(result?.insights) || result.insights.length === 0) {
      return NextResponse.json({
        insights: [],
        message:
          "No clear patterns detected. Add more applications and try again.",
      });
    }

    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal error";
    const detail = e instanceof Error ? e.stack : String(e);
    console.error("Blind spot analysis error:", msg, detail);

    if (msg.includes("not configured")) {
      return NextResponse.json(
        {
          error:
            "GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY not configured",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        error: "Something went wrong while analyzing. Please try again.",
        details: process.env.NODE_ENV === "development" ? detail : undefined,
      },
      { status: 500 },
    );
  }
}
