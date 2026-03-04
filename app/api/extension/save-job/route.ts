import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { applicationSchema } from "@/lib/validations/application";
import { logActivity } from "@/lib/activity";
import { extensionCorsHeaders } from "@/lib/extension-cors";

export async function OPTIONS(req: NextRequest) {
  return NextResponse.json(null, {
    status: 204,
    headers: extensionCorsHeaders(req, "POST, OPTIONS"),
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  const headers = extensionCorsHeaders(req, "POST, OPTIONS");

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers });
  }

  const body = await req.json();
  const parsed = applicationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 400, headers }
    );
  }

  const { stack, appliedAt, ...data } = parsed.data;
  const source = body.source === "extension" ? "extension" : "manual";

  const app = await prisma.application.create({
    data: {
      ...data,
      jobUrl: data.jobUrl || null,
      salary: data.salary || null,
      location: data.location || null,
      resumeLabel: data.resumeLabel || null,
      resumeFileUrl: data.resumeFileUrl || null,
      notes: data.notes || null,
      stack: JSON.stringify(stack),
      appliedAt: appliedAt ? new Date(appliedAt) : new Date(),
      source,
      userId: session.user.id,
    },
  });

  await logActivity(session.user.id, app.id, "Application created via extension");

  return NextResponse.json({ id: app.id }, { status: 201, headers });
}
