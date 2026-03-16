import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticatedAction } from "@/lib/api-auth";
import { applicationSchema } from "@/lib/validations/application";
import { logActivity } from "@/lib/activity";
import { recordStatusHistory } from "@/lib/applications";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, unauthorized } = await authenticatedAction();
  if (unauthorized) return unauthorized;

  const app = await prisma.application.findFirst({
    where: { id: params.id, userId: user.id },
    include: {
      contacts: true,
      events: { orderBy: { scheduledAt: "desc" } },
    },
  });

  if (!app) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(app);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, unauthorized } = await authenticatedAction();
  if (unauthorized) return unauthorized;

  const existing = await prisma.application.findFirst({
    where: { id: params.id, userId: user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();

  // Allow partial updates — only validate provided fields
  const updateData: Record<string, any> = {};

  if (body.status !== undefined) {
    updateData.status = body.status;
  }
  if (body.followUpDate !== undefined) {
    updateData.followUpDate = body.followUpDate ? new Date(body.followUpDate) : null;
  }
  if (body.company !== undefined) updateData.company = body.company;
  if (body.role !== undefined) updateData.role = body.role;
  if (body.jobUrl !== undefined) updateData.jobUrl = body.jobUrl || null;
  if (body.salary !== undefined) updateData.salary = body.salary || null;
  if (body.location !== undefined) updateData.location = body.location || null;
  if (body.type !== undefined) updateData.type = body.type;
  if (body.notes !== undefined) updateData.notes = body.notes || null;
  if (body.resumeLabel !== undefined) updateData.resumeLabel = body.resumeLabel || null;
  if (body.resumeFileUrl !== undefined) {
    updateData.resumeFileUrl = body.resumeFileUrl || null;
    if (!body.resumeFileUrl) {
      updateData.resumeFileName = null;
      updateData.resumeText = null;
      updateData.resumeUploadedAt = null;
    }
  }
  if (body.stack !== undefined) updateData.stack = JSON.stringify(body.stack);
  if (body.appliedAt !== undefined) {
    updateData.appliedAt = body.appliedAt ? new Date(body.appliedAt) : null;
  }

  const updated = await prisma.application.update({
    where: { id: params.id },
    data: updateData,
  });

  if (body.status !== undefined && body.status !== existing.status) {
    await Promise.all([
      logActivity(user.id, params.id, `Status changed to ${body.status}`),
      recordStatusHistory(params.id, existing.status, body.status),
    ]);
  }
  if (body.notes !== undefined && body.notes !== existing.notes) {
    await logActivity(user.id, params.id, "Note updated");
  }
  if (body.followUpDate !== undefined) {
    await logActivity(user.id, params.id, body.followUpDate ? "Follow-up reminder set" : "Follow-up reminder removed");
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, unauthorized } = await authenticatedAction();
  if (unauthorized) return unauthorized;

  const existing = await prisma.application.findFirst({
    where: { id: params.id, userId: user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await logActivity(user.id, params.id, "Application deleted");
  await prisma.application.delete({ where: { id: params.id } });

  return NextResponse.json({ deleted: true });
}
