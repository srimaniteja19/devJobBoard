import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticatedAction } from "@/lib/api-auth";

export async function GET() {
  const { user, unauthorized } = await authenticatedAction();
  if (unauthorized) return unauthorized;

  const saved = await prisma.savedJob.findMany({
    where: { userId: user.id },
    orderBy: { savedAt: "desc" },
  });
  return NextResponse.json({
    savedJobs: saved.map((s) => ({
      id: s.id,
      jobId: s.jobId,
      title: s.title,
      company: s.company,
      jobUrl: s.jobUrl,
      location: s.location,
      source: s.source,
      appliedAt: s.appliedAt?.toISOString() ?? null,
      savedAt: s.savedAt?.toISOString() ?? null,
    })),
  });
}

export async function POST(req: NextRequest) {
  const { user, unauthorized } = await authenticatedAction();
  if (unauthorized) return unauthorized;

  const body = await req.json().catch(() => ({}));
  const jobId = String(body.jobId ?? "").trim();
  const jobUrl = String(body.jobUrl ?? "").trim();
  const title = String(body.title ?? "").trim();
  const company = String(body.company ?? "").trim();
  const location = String(body.location ?? "").trim() || undefined;
  const source = String(body.source ?? "greenhouse").trim();
  const markApplied = body.applied === true;

  if (!jobId || !jobUrl || !title || !company) {
    return NextResponse.json(
      { error: "jobId, jobUrl, title, company required" },
      { status: 400 }
    );
  }

  try {
    const existing = await prisma.savedJob.findUnique({
      where: { userId_jobId: { userId: user.id, jobId } },
    });

    if (existing) {
      if (markApplied && !existing.appliedAt) {
        const updated = await prisma.savedJob.update({
          where: { id: existing.id },
          data: { appliedAt: new Date() },
        });
        return NextResponse.json({ savedJob: updated });
      }
      return NextResponse.json({ savedJob: existing });
    }

    const savedJob = await prisma.savedJob.create({
      data: {
        userId: user.id,
        jobId,
        jobUrl,
        title,
        company,
        location,
        source,
        appliedAt: markApplied ? new Date() : null,
      },
    });
    return NextResponse.json({ savedJob });
  } catch (e) {
    console.error("Save job error:", e);
    return NextResponse.json({ error: "Failed to save job" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { user, unauthorized } = await authenticatedAction();
  if (unauthorized) return unauthorized;

  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("jobId");
  if (!jobId) {
    return NextResponse.json({ error: "jobId required" }, { status: 400 });
  }

  try {
    await prisma.savedJob.deleteMany({
      where: { userId: user.id, jobId },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to remove" }, { status: 500 });
  }
}
