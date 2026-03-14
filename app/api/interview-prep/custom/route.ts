import { NextRequest, NextResponse } from "next/server";
import { generateJsonWithSearch } from "@/lib/gemini";
import { authenticatedAction } from "@/lib/api-auth";

const SYSTEM = `You are an expert interview coach. Generate comprehensive interview prep for any company and role.
Use Google Search to find accurate, up-to-date information about the company's interview process.
Output valid JSON only. Be specific to the company and role. Base your response on real sources.`;

export async function POST(req: NextRequest) {
  const { user, unauthorized } = await authenticatedAction();
  if (unauthorized) return unauthorized;

  const body = await req.json().catch(() => ({}));
  const company = String(body.company ?? "").trim();
  const jobTitle = String(body.jobTitle ?? "").trim();

  if (!company || !jobTitle) {
    return NextResponse.json(
      { error: "company and jobTitle required" },
      { status: 400 }
    );
  }

  if (company.length > 100 || jobTitle.length > 100) {
    return NextResponse.json(
      { error: "company and jobTitle must be under 100 characters" },
      { status: 400 }
    );
  }

  const userInput = `
Company: ${company}
Job title / role: ${jobTitle}

Generate a JSON object with:
{
  "process": "2-4 sentence overview of this company's typical interview process for this role (timeline, stages, what to expect)",
  "rounds": [
    { "name": "Round name", "duration": "e.g. 45 min", "description": "What happens", "types": ["technical" or "system_design" or "behavioral"] }
  ],
  "technical": {
    "summary": "1-2 sentences on technical interview expectations",
    "topics": ["topic1", "topic2", "topic3", "topic4"],
    "sampleQuestions": ["q1", "q2", "q3", "q4", "q5"],
    "topTips": ["tip1", "tip2", "tip3"],
    "commonMistakes": ["mistake1", "mistake2"]
  },
  "systemDesign": {
    "summary": "1-2 sentences on system design expectations (or N/A if not applicable)",
    "topics": ["topic1", "topic2"],
    "sampleQuestions": ["q1", "q2", "q3"],
    "topTips": ["tip1", "tip2"],
    "commonMistakes": ["mistake1"]
  },
  "behavioral": {
    "summary": "1-2 sentences on behavioral/culture fit expectations",
    "sampleQuestions": ["q1", "q2", "q3", "q4"],
    "topTips": ["tip1", "tip2", "tip3"],
    "commonMistakes": ["mistake1"]
  },
  "resources": [{"type": "video|article|course|platform", "label": "Resource name", "url": "https://...", "description": "1 sentence"}]
}
Include 4-8 resources: YouTube videos, articles, courses, practice platforms. Prefer 2024-2025 content. Output only the JSON.
`;

  try {
    const { data, groundingMetadata } = await generateJsonWithSearch(SYSTEM, userInput);
    const result = data as {
      process: string;
      rounds: { name: string; duration: string; description: string; types: string[] }[];
      technical: {
        summary: string;
        topics: string[];
        sampleQuestions: string[];
        topTips: string[];
        commonMistakes: string[];
      };
      systemDesign: {
        summary: string;
        topics: string[];
        sampleQuestions: string[];
        topTips: string[];
        commonMistakes: string[];
      };
      behavioral: {
        summary: string;
        sampleQuestions: string[];
        topTips: string[];
        commonMistakes: string[];
      };
      resources: { type?: string; label: string; url: string; description?: string }[];
    };
    return NextResponse.json({
      company,
      jobTitle,
      ...result,
      groundingMetadata,
    });
  } catch (e) {
    console.error("Custom interview prep error:", e);
    return NextResponse.json(
      { error: "Failed to generate prep content" },
      { status: 500 }
    );
  }
}
