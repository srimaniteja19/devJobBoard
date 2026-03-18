import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticatedAction } from "@/lib/api-auth";
import { applicationSchema } from "@/lib/validations/application";
import { logActivity } from "@/lib/activity";
import { parseYMDLocal } from "@/lib/date-helpers";

export async function GET() {
  const { user, unauthorized } = await authenticatedAction();
  if (unauthorized) return unauthorized;

  const apps = await prisma.application.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      company: true,
      role: true,
      status: true,
      location: true,
      stack: true,
      resumeLabel: true,
      appliedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(apps);
}

export async function POST(req: NextRequest) {
  const { user, unauthorized } = await authenticatedAction();
  if (unauthorized) return unauthorized;

  const body = await req.json();
  const parsed = applicationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { stack, appliedAt, ...data } = parsed.data;

  // Avoid duplicate when same job URL already tracked
  if (data.jobUrl) {
    const existing = await prisma.application.findFirst({
      where: { userId: user.id, jobUrl: data.jobUrl },
    });
    if (existing) return NextResponse.json({ id: existing.id }, { status: 201 });
  }

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
      appliedAt: appliedAt ? parseYMDLocal(appliedAt) : new Date(),
      userId: user.id,
    },
  });

  await logActivity(user.id, app.id, "Application created");

  return NextResponse.json({ id: app.id }, { status: 201 });
}
