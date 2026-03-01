import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticatedAction } from "@/lib/api-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, unauthorized } = await authenticatedAction();
  if (unauthorized) return unauthorized;

  const stage = req.nextUrl.searchParams.get("stage");
  if (!stage) {
    return NextResponse.json({ error: "stage query param required" }, { status: 400 });
  }

  try {
    const app = await prisma.application.findFirst({
      where: { id: params.id, userId: user.id },
      include: {
        preps: {
          where: { stage },
          select: { sectionKey: true, content: true },
        },
      },
    });

    if (!app) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const result: Record<string, unknown> = {};
    for (const p of app.preps) {
      try {
        result[p.sectionKey] = JSON.parse(p.content);
      } catch {
        result[p.sectionKey] = p.content;
      }
    }

    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal error";
    console.error("Get prep error:", msg);
    return NextResponse.json({ error: "Failed to load prep" }, { status: 500 });
  }
}
