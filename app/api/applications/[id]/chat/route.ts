import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/db";
import { authenticatedAction } from "@/lib/api-auth";

const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GEMINI_API_KEY;
const MAX_MESSAGES_RETURN = 50;
const MAX_MESSAGES_CONTEXT = 30;

function parseStack(stack: string): string[] {
  try {
    const arr = JSON.parse(stack);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function isMockInterviewRequest(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("mock interview") ||
    lower.includes("start a mock") ||
    (lower.includes("interview") && (lower.includes("start") || lower.includes("begin")))
  );
}

function buildSystemPrompt(app: {
  role: string;
  company: string;
  location: string | null;
  type: string;
  salary: string | null;
  status: string;
  stack: string;
  notes: string | null;
  resumeText: string | null;
  resumeFileName: string | null;
}, conversationSummary?: string, isMockInterview?: boolean): string {
  const stack = parseStack(app.stack);
  const currentDate = new Date().toLocaleDateString();
  let prompt = `You are an expert job search coach and career advisor with deep knowledge of recruiting, interviews, salary negotiation, and resume writing.

You are helping a candidate with this specific job application:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Role: ${app.role}
Company: ${app.company}
Location: ${app.location ?? "Not specified"}
Job Type: ${app.type}
Salary: ${app.salary ?? "not specified"}
Current Stage: ${app.status}
Tech Stack: ${stack.join(", ") || "Not specified"}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Job Description:
${app.notes?.trim() || "Not provided yet. If the user pastes a JD, use it."}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Candidate Resume:
${app.resumeText?.trim() || "Not uploaded yet. If the user shares their resume, use it."}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
  if (conversationSummary) {
    prompt += `\nPrevious conversation summary (older messages):\n${conversationSummary}\n\n`;
  }
  prompt += `BEHAVIOR RULES:
- Be direct, specific, and actionable. No fluff.
- Always tailor advice to THIS specific role and company.
- When asked for scripts/emails/answers: write the full thing, don't summarize.
- Format responses in clean markdown (headers, bullets, bold where useful).
- If asked for interview questions: generate them specific to this JD.
- If asked to review something pasted: give detailed, honest feedback.
- If the JD or resume isn't available yet, ask the user to paste it.
- Keep responses concise unless depth is needed.
- You have memory of this entire conversation — reference earlier messages.
- Current date: ${currentDate}

You can help with ANYTHING related to this application:
interview prep, resume tailoring, cover letters, salary negotiation,
company research, email drafts, STAR stories, technical prep,
offer evaluation, follow-up strategies, or just thinking through decisions.`;

  if (isMockInterview) {
    prompt += `

MOCK INTERVIEW MODE ACTIVE:
You are now conducting a mock interview for ${app.role} at ${app.company}.
- Ask ONE question at a time. Wait for the candidate's answer.
- After each answer: give brief feedback (2-3 sentences) on: what was strong, what was missing, and a better version in one sentence.
- Then ask the next question.
- Start by saying you're beginning the mock interview and ask the first question.`;
  }

  return prompt;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, unauthorized } = await authenticatedAction();
  if (unauthorized) return unauthorized;

  const app = await prisma.application.findFirst({
    where: { id: params.id, userId: user.id },
  });
  if (!app) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const messages = await prisma.chatMessage.findMany({
    where: { applicationId: params.id },
    orderBy: { createdAt: "asc" },
    take: MAX_MESSAGES_RETURN,
  });

  return NextResponse.json(messages);
}

export async function POST(
  req: NextRequest,
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

  let body: {
    message?: string;
    attachmentText?: string;
    attachmentName?: string;
    regenerateMessageId?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  const attachmentText = typeof body.attachmentText === "string" ? body.attachmentText.trim() : undefined;
  const attachmentName = typeof body.attachmentName === "string" ? body.attachmentName.trim() : undefined;
  const regenerateMessageId = typeof body.regenerateMessageId === "string" ? body.regenerateMessageId : undefined;

  const app = await prisma.application.findFirst({
    where: { id: params.id, userId: user.id },
    select: {
      id: true,
      role: true,
      company: true,
      location: true,
      type: true,
      salary: true,
      status: true,
      stack: true,
      notes: true,
      resumeText: true,
      resumeFileName: true,
    },
  });

  if (!app) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let allMessages = await prisma.chatMessage.findMany({
    where: { applicationId: params.id },
    orderBy: { createdAt: "asc" },
  });

  if (regenerateMessageId) {
    allMessages = allMessages.filter((m) => m.id !== regenerateMessageId);
  }

  let historyMessages = allMessages;
  let conversationSummary: string | undefined;
  if (allMessages.length > MAX_MESSAGES_CONTEXT) {
    const recent = allMessages.slice(-MAX_MESSAGES_CONTEXT);
    const older = allMessages.slice(0, -MAX_MESSAGES_CONTEXT);
    conversationSummary = older
      .map((m) => `${m.role}: ${m.content.slice(0, 200)}${m.content.length > 200 ? "..." : ""}`)
      .join("\n");
    historyMessages = recent;
  }

  const history = historyMessages.map((msg) => ({
    role: msg.role === "user" ? ("user" as const) : ("model" as const),
    parts: [{ text: msg.content }],
  }));

  const userContent = attachmentText && attachmentName
    ? `[Attached file: ${attachmentName}]\n\n${attachmentText}\n\n${message}`
    : message;

  const isMockInterview = isMockInterviewRequest(userContent);
  const systemInstruction = buildSystemPrompt(app, conversationSummary, isMockInterview);

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      systemInstruction,
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7,
      },
    });

    const chat = model.startChat({
      history,
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7,
      },
    });

    const result = await chat.sendMessage(userContent);
    const responseText = result?.response?.text?.() ?? "";

    if (regenerateMessageId) {
      await prisma.chatMessage.deleteMany({
        where: {
          applicationId: params.id,
          id: regenerateMessageId,
          role: "assistant",
        },
      });
    } else {
      await prisma.chatMessage.create({
        data: {
          applicationId: params.id,
          role: "user",
          content: message,
          attachmentName: attachmentName ?? null,
          attachmentText: attachmentText ?? null,
        },
      });
    }

    await prisma.chatMessage.create({
      data: {
        applicationId: params.id,
        role: "assistant",
        content: responseText || "(No response generated.)",
      },
    });

    return NextResponse.json({ response: responseText || "(No response generated.)" });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal error";
    console.error("Chat POST error:", msg, e instanceof Error ? e.stack : "");
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, unauthorized } = await authenticatedAction();
  if (unauthorized) return unauthorized;

  const app = await prisma.application.findFirst({
    where: { id: params.id, userId: user.id },
  });
  if (!app) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.chatMessage.deleteMany({
    where: { applicationId: params.id },
  });

  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, unauthorized } = await authenticatedAction();
  if (unauthorized) return unauthorized;

  const app = await prisma.application.findFirst({
    where: { id: params.id, userId: user.id },
  });
  if (!app) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: { messageId?: string; feedback?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const messageId = typeof body.messageId === "string" ? body.messageId : "";
  const feedback = body.feedback === "positive" || body.feedback === "negative" ? body.feedback : null;
  if (!messageId || feedback === null) {
    return NextResponse.json({ error: "messageId and feedback (positive|negative) required" }, { status: 400 });
  }

  await prisma.chatMessage.updateMany({
    where: {
      id: messageId,
      applicationId: params.id,
      role: "assistant",
    },
    data: { feedback },
  });

  return NextResponse.json({ ok: true });
}
