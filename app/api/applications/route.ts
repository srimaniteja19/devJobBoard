import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticatedAction } from "@/lib/api-auth";
import { applicationSchema } from "@/lib/validations/application";

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

  const app = await prisma.application.create({
    data: {
      ...data,
      jobUrl: data.jobUrl || null,
      salary: data.salary || null,
      location: data.location || null,
      resumeLabel: data.resumeLabel || null,
      notes: data.notes || null,
      stack: JSON.stringify(stack),
      appliedAt: appliedAt ? new Date(appliedAt) : null,
      userId: user.id,
    },
  });

  return NextResponse.json({ id: app.id }, { status: 201 });
}
