import { NextRequest, NextResponse } from "next/server";
import { generateJsonWithSearch } from "@/lib/gemini";
import { authenticatedAction } from "@/lib/api-auth";
import { INTERVIEW_PREP_COMPANIES, type InterviewType } from "@/lib/interview-prep-data";

const SYSTEM = `You are an expert interview coach. Find and suggest up-to-date learning resources for tech interview prep.
Use Google Search to find real, recent resources (2024-2025). Include a mix of videos, articles, courses, and practice platforms.
Output valid JSON only. Prefer free or widely-accessible resources. Include real URLs.`;

export async function POST(req: NextRequest) {
  const { user, unauthorized } = await authenticatedAction();
  if (unauthorized) return unauthorized;

  const body = await req.json().catch(() => ({}));
  const companyId = String(body.companyId ?? "").trim();
  const company = String(body.company ?? "").trim();
  const jobTitle = String(body.jobTitle ?? "").trim();
  const interviewType = String(body.interviewType ?? "technical").trim() as InterviewType;

  if (!companyId && !company) {
    return NextResponse.json({ error: "companyId or company required" }, { status: 400 });
  }

  const companyName = companyId
    ? INTERVIEW_PREP_COMPANIES.find((c) => c.id === companyId)?.name ?? companyId
    : company;
  const context = jobTitle
    ? `${companyName} ${jobTitle} interview`
    : `${companyName} ${interviewType} interview prep`;

  const userInput = `
Context: ${context}

Search for and suggest up-to-date resources (2024-2025 preferred). Generate a JSON object with:
{
  "resources": [
    {
      "type": "video",
      "label": "Short descriptive title",
      "url": "https://...",
      "description": "1 sentence on what it covers"
    },
    {
      "type": "article",
      "label": "Article/blog title",
      "url": "https://...",
      "description": "1 sentence summary"
    },
    {
      "type": "course",
      "label": "Course name",
      "url": "https://...",
      "description": "1 sentence on what it teaches"
    },
    {
      "type": "platform",
      "label": "Practice platform or tool",
      "url": "https://...",
      "description": "1 sentence on how it helps"
    }
  ]
}
Include 6-12 resources. Mix types: videos (YouTube, etc.), articles, blog posts, courses (free tiers OK), practice platforms.
Use real URLs from real sources. Prioritize recent (2024-2025) and high-quality content. Output only the JSON.
`;

  try {
    const { data, groundingMetadata } = await generateJsonWithSearch(SYSTEM, userInput);
    const result = data as {
      resources: { type: string; label: string; url: string; description?: string }[];
    };
    return NextResponse.json({
      ...result,
      groundingMetadata,
    });
  } catch (e) {
    console.error("Interview prep resources error:", e);
    return NextResponse.json(
      { error: "Failed to fetch resources" },
      { status: 500 }
    );
  }
}
