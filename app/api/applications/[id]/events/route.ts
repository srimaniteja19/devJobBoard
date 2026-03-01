import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticatedAction } from "@/lib/api-auth";
import { eventSchema } from "@/lib/validations/application";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, unauthorized } = await authenticatedAction();
  if (unauthorized) return unauthorized;

  const app = await prisma.application.findFirst({
    where: { id: params.id, userId: user.id },
  });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const event = await prisma.event.create({
    data: {
      type: parsed.data.type,
      scheduledAt: new Date(parsed.data.scheduledAt),
      notes: parsed.data.notes || null,
      applicationId: params.id,
    },
  });

  return NextResponse.json(event, { status: 201 });
}
