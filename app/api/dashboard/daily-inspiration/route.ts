import { NextResponse } from "next/server";
import { generateJsonWithSearch } from "@/lib/gemini";
import { authenticatedAction } from "@/lib/api-auth";

const SYSTEM = `You are a supportive coach. Generate a daily motivation and a random 5-10 minute learning suggestion.
Use Google Search to find real, recent resources: articles, videos, or tips.
Output valid JSON only. Keep it concise and actionable.`;

export async function GET() {
  const { unauthorized } = await authenticatedAction();
  if (unauthorized) return unauthorized;

  const userInput = `Generate a JSON object with:
{
  "motivation": "One short, uplifting quote or message (1-2 sentences, general life/career)",
  "quickLearn": {
    "title": "Short catchy title of what to learn",
    "description": "1-2 sentences on why it's interesting or useful",
    "type": "article" | "video" | "tip",
    "resource": {
      "label": "Resource title",
      "url": "https://...",
      "duration": "~5 min" or "~10 min"
    }
  }
}
Pick a RANDOM topic—anything that can be learned in 5-10 min. Examples: a science fact, productivity tip, cooking trick, psychology insight, history snippet, creative skill, mindfulness exercise, fun fact, language tip, music/art, health, philosophy, etc. Vary widely—not limited to jobs or interview prep.
Use Google Search to find a real, free resource (article, YouTube video, or blog post). Prefer recent content.
Output only the JSON.`;

  try {
    const { data } = await generateJsonWithSearch(SYSTEM, userInput);
    return NextResponse.json(data);
  } catch (e) {
    console.error("Daily inspiration error:", e);
    return NextResponse.json(
      { error: "Failed to fetch inspiration" },
      { status: 500 }
    );
  }
}
