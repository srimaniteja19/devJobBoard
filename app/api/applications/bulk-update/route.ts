import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticatedAction } from "@/lib/api-auth";
import { logActivity } from "@/lib/activity";

export async function PATCH(req: NextRequest) {
  const { user, unauthorized } = await authenticatedAction();
  if (unauthorized) return unauthorized;

  const { ids, status } = await req.json();

  if (!Array.isArray(ids) || !ids.length || !status) {
    return NextResponse.json({ error: "ids[] and status required" }, { status: 400 });
  }

  await prisma.application.updateMany({
    where: { id: { in: ids }, userId: user.id },
    data: { status },
  });

  for (const id of ids) {
    await logActivity(user.id, id, `Status changed to ${status}`);
  }

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
