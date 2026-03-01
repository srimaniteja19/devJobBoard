import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticatedAction } from "@/lib/api-auth";
import { contactSchema } from "@/lib/validations/application";
import { logActivity } from "@/lib/activity";

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
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const contact = await prisma.contact.create({
    data: {
      ...parsed.data,
      email: parsed.data.email || null,
      linkedin: parsed.data.linkedin || null,
      applicationId: params.id,
    },
  });

  await logActivity(user.id, params.id, `Contact added: ${parsed.data.name}`);

  return NextResponse.json(contact, { status: 201 });
}
