import { NextRequest, NextResponse } from "next/server";
import { authenticatedAction } from "@/lib/api-auth";
import { generateJson } from "@/lib/gemini";
import { stripHtmlToText, isLikelyBlockedHost } from "@/lib/jd-extractor";

const FETCH_TIMEOUT_MS = 8000;
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export interface ExtractJDResult {
  success: boolean;
  reason?: string;
  jobTitle?: string;
  company?: string;
  location?: string;
  jobType?: string;
  salary?: string;
  description?: string;
  requirements?: string[];
  niceToHave?: string[];
  techStack?: string[];
  extractionConfidence?: "high" | "medium" | "low";
}

function mapJobTypeToAppType(jobType: string): "REMOTE" | "HYBRID" | "ONSITE" {
  const t = jobType?.toLowerCase() ?? "";
  if (t.includes("remote")) return "REMOTE";
  if (t.includes("hybrid")) return "HYBRID";
  if (t.includes("onsite") || t.includes("on-site") || t.includes("in-office"))
    return "ONSITE";
  return "REMOTE";
}

export async function POST(req: NextRequest) {
  const { user, unauthorized } = await authenticatedAction();
  if (unauthorized) return unauthorized;

  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, reason: "Invalid request body" },
      { status: 400 }
    );
  }

  const url = typeof body.url === "string" ? body.url.trim() : "";
  if (!url) {
    return NextResponse.json(
      { success: false, reason: "URL is required" },
      { status: 400 }
    );
  }

  try {
    new URL(url);
  } catch {
    return NextResponse.json(
      { success: false, reason: "Invalid URL format" },
      { status: 400 }
    );
  }

  if (isLikelyBlockedHost(url)) {
    return NextResponse.json({
      success: false,
      reason:
        "LinkedIn blocks direct extraction. Please copy-paste the JD below.",
    });
  }

  let html: string;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT },
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      if (res.status === 403) {
        return NextResponse.json({
          success: false,
          reason:
            "This site blocks automated access. Please copy-paste the job description below.",
        });
      }
      return NextResponse.json({
        success: false,
        reason: `Page not found or error (${res.status}). Please paste the JD manually.`,
      });
    }

    html = await res.text();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("abort")) {
      return NextResponse.json({
        success: false,
        reason: "Request timed out. Please paste the job description below.",
      });
    }
    return NextResponse.json({
      success: false,
      reason:
        "Could not fetch the page. Please paste the job description below.",
    });
  }

  const strippedText = stripHtmlToText(html);
  if (strippedText.length < 200) {
    return NextResponse.json({
      success: false,
      reason:
        "Page content too short or not a job page. Please paste the JD manually.",
    });
  }

  try {
    const systemInstruction = `Extract the job description from this webpage text. Return ONLY valid JSON. No markdown, no backticks.`;
    const userInput = `Extract the job description from this webpage text.
Return ONLY valid JSON:
{
  "success": true,
  "jobTitle": "string",
  "company": "string",
  "location": "string",
  "jobType": "Remote | Hybrid | Onsite",
  "salary": "string or empty if not mentioned",
  "description": "full JD cleaned up, plain text",
  "requirements": ["bullet requirement 1", "..."],
  "niceToHave": ["nice to have 1", "..."],
  "techStack": ["tech1", "tech2", "..."],
  "extractionConfidence": "high" | "medium" | "low"
}
If this page does not contain a job description return:
{ "success": false, "reason": "string explaining why" }

Text to analyze:
${strippedText}`;

    const result = (await generateJson(systemInstruction, userInput)) as ExtractJDResult;

    if (!result.success) {
      return NextResponse.json({
        success: false,
        reason: result.reason ?? "No job description found on page.",
      });
    }

    const notesParts: string[] = [];
    if (result.description) notesParts.push(result.description);
    if (Array.isArray(result.requirements) && result.requirements.length > 0) {
      notesParts.push("\n\nRequirements:\n" + result.requirements.map((r) => `- ${r}`).join("\n"));
    }
    if (Array.isArray(result.niceToHave) && result.niceToHave.length > 0) {
      notesParts.push("\n\nNice to have:\n" + result.niceToHave.map((n) => `- ${n}`).join("\n"));
    }
    const notes = notesParts.join("").trim();

    return NextResponse.json({
      success: true,
      jobTitle: result.jobTitle ?? "",
      company: result.company ?? "",
      location: result.location ?? "",
      jobType: result.jobType ?? "Remote",
      type: mapJobTypeToAppType(result.jobType ?? ""),
      salary: result.salary ?? "",
      notes,
      techStack: Array.isArray(result.techStack) ? result.techStack : [],
      extractionConfidence: result.extractionConfidence ?? "medium",
    });
  } catch (e) {
    console.error("Extract JD Gemini error:", e);
    return NextResponse.json({
      success: false,
      reason: "Could not parse job description. Please paste it manually.",
    });
  }
}
