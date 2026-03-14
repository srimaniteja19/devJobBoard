import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticatedAction } from "@/lib/api-auth";

export async function GET() {
  const { user, unauthorized } = await authenticatedAction();
  if (unauthorized) return unauthorized;

  const notes = await prisma.quickApplyNote.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({
    notes: notes.map((n) => ({
      id: n.id,
      label: n.label,
      content: n.content,
      createdAt: n.createdAt?.toISOString() ?? null,
    })),
  });
}

export async function POST(req: NextRequest) {
  const { user, unauthorized } = await authenticatedAction();
  if (unauthorized) return unauthorized;

  const body = await req.json().catch(() => ({}));
  const label = String(body.label ?? "Untitled").trim().slice(0, 80);
  const content = String(body.content ?? "").trim().slice(0, 4000);

  if (!content) {
    return NextResponse.json(
      { error: "content required" },
      { status: 400 }
    );
  }

  try {
    const note = await prisma.quickApplyNote.create({
      data: { userId: user.id, label: label || "Untitled", content },
    });
    return NextResponse.json({ note: { id: note.id, label: note.label, content: note.content, createdAt: note.createdAt?.toISOString() ?? null } });
  } catch (e) {
    console.error("Quick apply note create error:", e);
    return NextResponse.json({ error: "Failed to save note" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { user, unauthorized } = await authenticatedAction();
  if (unauthorized) return unauthorized;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  try {
    await prisma.quickApplyNote.deleteMany({
      where: { userId: user.id, id },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
