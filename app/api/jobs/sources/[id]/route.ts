import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticatedAction } from "@/lib/api-auth";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, unauthorized } = await authenticatedAction();
  if (unauthorized) return unauthorized;

  const deleted = await prisma.userJobSource.deleteMany({
    where: { id: params.id, userId: user.id },
  });
  if (deleted.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
