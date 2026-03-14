import { NextRequest, NextResponse } from "next/server";
import { generateJsonWithSearch } from "@/lib/gemini";
import { authenticatedAction } from "@/lib/api-auth";
import {
  INTERVIEW_PREP_COMPANIES,
  type InterviewType,
} from "@/lib/interview-prep-data";

const SYSTEM = `You are an expert interview coach. Generate concise, actionable prep content for tech interviews.
Use Google Search to find accurate, up-to-date information about how each company conducts interviews.
Output valid JSON only. Be specific to the company and interview type. Base your response on real, recent sources.`;

export async function POST(req: NextRequest) {
  const { user, unauthorized } = await authenticatedAction();
  if (unauthorized) return unauthorized;

  const body = await req.json().catch(() => ({}));
  const companyId = String(body.companyId ?? "").trim();
  const interviewType = String(body.interviewType ?? "technical").trim() as InterviewType;

  const company = INTERVIEW_PREP_COMPANIES.find((c) => c.id === companyId);
  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 400 });
  }

  const validTypes: InterviewType[] = ["technical", "system_design", "behavioral", "culture_fit"];
  if (!validTypes.includes(interviewType)) {
    return NextResponse.json({ error: "Invalid interview type" }, { status: 400 });
  }

  const typeInfo =
    interviewType === "culture_fit"
      ? company.cultureFit ?? company.technical
      : interviewType === "system_design"
        ? company.systemDesign
        : interviewType === "behavioral"
          ? company.behavioral
          : company.technical;
  const rounds = company.rounds.filter((r) => r.types.includes(interviewType));

  const userInput = `
Company: ${company.name}
Interview type: ${interviewType}
Process: ${company.process}
Relevant rounds: ${rounds.map((r) => `${r.name} (${r.duration})`).join(", ")}
Topics: ${(typeInfo?.topics ?? []).join(", ")}
Sample questions we already have: ${(typeInfo?.sampleQuestions ?? []).slice(0, 5).join("; ")}

Generate a JSON object with:
{
  "summary": "2-3 sentence overview of how ${company.name} conducts this type of interview and what to expect",
  "topTips": ["tip1", "tip2", "tip3", "tip4", "tip5"],
  "extraSampleQuestions": ["q1", "q2", "q3", "q4", "q5"],
  "commonMistakes": ["mistake1", "mistake2", "mistake3"],
  "resources": [{"type": "video|article|course|platform", "label": "Resource name", "url": "https://...", "description": "1 sentence"}]
}
Be specific to ${company.name}. Include 2-4 resources: videos, articles, courses. Prefer 2024-2025 content. Output only the JSON.
`;

  try {
    const { data, groundingMetadata } = await generateJsonWithSearch(SYSTEM, userInput);
    const result = data as {
      summary: string;
      topTips: string[];
      extraSampleQuestions: string[];
      commonMistakes: string[];
      resources: { type?: string; label: string; url: string; description?: string }[];
    };
    return NextResponse.json({
      companyId,
      interviewType,
      ...result,
      groundingMetadata,
    });
  } catch (e) {
    console.error("Interview prep generate error:", e);
    return NextResponse.json(
      { error: "Failed to generate prep content" },
      { status: 500 }
    );
  }
}
