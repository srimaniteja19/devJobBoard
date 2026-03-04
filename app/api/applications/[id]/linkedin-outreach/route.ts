import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/db";
import { authenticatedAction } from "@/lib/api-auth";

const API_KEY =
  process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GEMINI_API_KEY;

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

export interface LinkedInOutreachResult {
  suggestedContacts?: Array<{ name: string; role: string; reason: string }>;
  connectionRequest?: string;
  followUpMessage?: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  if (!API_KEY) {
    return NextResponse.json(
      {
        error: "GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY not configured",
      },
      { status: 500 },
    );
  }

  const { user, unauthorized } = await authenticatedAction();
  if (unauthorized) return unauthorized;

  let body: { contactName?: string; contactRole?: string };
  try {
    body = await req.json().catch(() => ({}));
  } catch {
    body = {};
  }

  const contactName =
    typeof body.contactName === "string" ? body.contactName.trim() : "";
  const contactRole =
    typeof body.contactRole === "string" ? body.contactRole.trim() : "";
  const hasContact = contactName.length > 0 || contactRole.length > 0;

  try {
    const app = await prisma.application.findFirst({
      where: { id: params.id, userId: user.id },
    });

    if (!app) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const stack = parseStack(app.stack);
    const notes = (app.notes ?? "").slice(0, 500);
    const genAI = new GoogleGenerativeAI(API_KEY);

    // Use search grounding for real company info (news, culture, recent events).
    // Note: responseMimeType: "application/json" is incompatible with tools, so we instruct JSON output and parse it.
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      tools: [{ google_search: {} }] as unknown as {
        googleSearchRetrieval?: object;
      }[],
      systemInstruction: `You are a professional LinkedIn outreach coach. Your job is to write highly personalized, non-cringe LinkedIn messages.

CRITICAL: You MUST respond with ONLY valid JSON. No markdown, no code fences, no explanation. Raw JSON only.

Guidelines:
- Connection requests must be under 300 characters (LinkedIn limit). Be concise and genuine.
- Reference something real about the company (recent news, product, mission, culture) — use web search if needed.
- Reference the specific role they're applying for. Never be generic.
- Avoid corporate-speak, buzzwords, and flattery. Sound human and authentic.
- Follow-up messages should be 2–4 short paragraphs, conversational, and add value.
- If suggesting who to reach out to: recommend recruiter, hiring manager, or engineer on the team with a clear reason for each.`,
    });

    const userInput = hasContact
      ? `Generate a LinkedIn connection request AND a follow-up message (to send after they accept) for this outreach:

Company: ${app.company}
Role I'm applying for: ${app.role}
Contact name: ${contactName || "(unknown)"}
Contact role at company: ${contactRole || "(unknown)"}
${stack.length ? `Tech stack: ${stack.join(", ")}` : ""}
${notes ? `Application notes: ${notes}` : ""}

Return ONLY a valid JSON object (no markdown, no explanation):
{
  "connectionRequest": "string (under 300 chars, personalized, references company and role)",
  "followUpMessage": "string (2-4 paragraphs, conversational, adds value)"
}

Use web search to find something real about ${app.company} (recent news, product launch, mission, culture) and weave it into the messages naturally.`
      : `Suggest who exactly to reach out to at ${app.company} for a ${app.role} position. I don't know who to contact yet.

${stack.length ? `Tech stack: ${stack.join(", ")}` : ""}
${notes ? `Application notes: ${notes}` : ""}

Use web search to find real people or typical roles at ${app.company}. Return ONLY a valid JSON object (no markdown, no explanation):
{
  "suggestedContacts": [
    {
      "name": "string (actual name if found, or 'Recruiter'/'Hiring Manager' etc.)",
      "role": "string (e.g. Technical Recruiter, Engineering Manager)",
      "reason": "string (why reach out to this person, 1-2 sentences)"
    }
  ]
}

Include 2-4 suggestions. Prefer recruiters, hiring managers, or engineers on the team.`;

    const result = await model.generateContent(userInput);
    const text = result?.response?.text?.() ?? "";
    if (!text) {
      return NextResponse.json(
        { error: "Empty response from AI. Please try again." },
        { status: 500 },
      );
    }

    const parsed = parseJsonFromText(text) as LinkedInOutreachResult;

    // Validate structure
    if (hasContact) {
      if (
        !parsed?.connectionRequest ||
        typeof parsed.connectionRequest !== "string"
      ) {
        return NextResponse.json(
          { error: "Could not generate connection request. Please try again." },
          { status: 500 },
        );
      }
      if (
        !parsed?.followUpMessage ||
        typeof parsed.followUpMessage !== "string"
      ) {
        parsed.followUpMessage = "";
      }
    } else {
      if (
        !Array.isArray(parsed?.suggestedContacts) ||
        parsed.suggestedContacts.length === 0
      ) {
        return NextResponse.json(
          { error: "Could not suggest contacts. Please try again." },
          { status: 500 },
        );
      }
    }

    return NextResponse.json(parsed);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal error";
    const detail = e instanceof Error ? e.stack : String(e);
    console.error("LinkedIn outreach error:", msg, detail);
    return NextResponse.json(
      {
        error:
          "Something went wrong while generating outreach. Please try again.",
        details: process.env.NODE_ENV === "development" ? detail : undefined,
      },
      { status: 500 },
    );
  }
}
