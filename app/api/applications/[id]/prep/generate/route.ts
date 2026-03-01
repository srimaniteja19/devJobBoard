import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticatedAction } from "@/lib/api-auth";
import { generateJson } from "@/lib/gemini";
import { getPrepPrompt } from "@/lib/prep-prompts";
import type { AppStatus } from "@/types";

function parseStack(stack: string): string[] {
  try {
    const arr = JSON.parse(stack);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, unauthorized } = await authenticatedAction();
  if (unauthorized) return unauthorized;

  let body: { stage?: string; section?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { stage, section } = body;
  if (!stage || !section || typeof stage !== "string" || typeof section !== "string") {
    return NextResponse.json(
      { error: "stage and section required" },
      { status: 400 }
    );
  }

  try {
    const app = await prisma.application.findFirst({
      where: { id: params.id, userId: user.id },
    });

    if (!app) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const stack = parseStack(app.stack);
    const ctx = {
      role: app.role,
      company: app.company,
      location: app.location,
      type: app.type,
      stack,
      salary: app.salary,
      notes: (app.notes ?? "").slice(0, 3000),
      resumeText: "not provided",
      status: stage,
    };

    const { systemInstruction, userInput } = getPrepPrompt(
      stage as AppStatus,
      section,
      ctx
    );

    const content = await generateJson(systemInstruction, userInput);
    const contentStr = typeof content === "string" ? content : JSON.stringify(content);

    await prisma.applicationPrep.upsert({
      where: {
        applicationId_stage_sectionKey: {
          applicationId: params.id,
          stage,
          sectionKey: section,
        },
      },
      create: {
        applicationId: params.id,
        stage,
        sectionKey: section,
        content: contentStr,
      },
      update: {
        content: contentStr,
      },
    });

    return NextResponse.json({
      content: typeof content === "object" ? content : JSON.parse(contentStr),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal error";
    const detail = e instanceof Error ? e.stack : String(e);
    console.error("Prep generate error:", msg, detail);

    if (msg.includes("not configured")) {
      return NextResponse.json(
        { error: "GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY not configured" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: "Something went wrong while generating prep. Please try again.",
        details: process.env.NODE_ENV === "development" ? detail : undefined,
      },
      { status: 500 }
    );
  }
}
