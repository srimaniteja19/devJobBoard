import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticatedAction } from "@/lib/api-auth";
import { logActivity } from "@/lib/activity";
import { recordStatusHistory } from "@/lib/applications";

export async function PATCH(req: NextRequest) {
  const { user, unauthorized } = await authenticatedAction();
  if (unauthorized) return unauthorized;

  const { ids, status } = await req.json();

  if (!Array.isArray(ids) || !ids.length || !status) {
    return NextResponse.json({ error: "ids[] and status required" }, { status: 400 });
  }

  const existing = await prisma.application.findMany({
    where: { id: { in: ids }, userId: user.id },
    select: { id: true, status: true },
  });

  await prisma.application.updateMany({
    where: { id: { in: ids }, userId: user.id },
    data: { status },
  });

  await Promise.all(
    existing.map((app) =>
      Promise.all([
        logActivity(user.id, app.id, `Status changed to ${status}`),
        recordStatusHistory(app.id, app.status, status),
      ])
    )
  );

  return NextResponse.json({ updated: ids.length });
}

export async function DELETE(req: NextRequest) {
  const { user, unauthorized } = await authenticatedAction();
  if (unauthorized) return unauthorized;

  const { ids } = await req.json();

  if (!Array.isArray(ids) || !ids.length) {
    return NextResponse.json({ error: "ids[] required" }, { status: 400 });
  }

  await prisma.application.deleteMany({
    where: { id: { in: ids }, userId: user.id },
  });

  return NextResponse.json({ deleted: ids.length });
}
