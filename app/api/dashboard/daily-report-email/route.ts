import { NextRequest, NextResponse } from "next/server";
import { authenticatedAction } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

function parseEmailList(input: string): string[] {
  return input
    .split(/[,\n;\r\t ]+/g)
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
}

export async function GET() {
  const { user, unauthorized } = await authenticatedAction();
  if (unauthorized) return unauthorized;

  const setting = await prisma.dailyReportEmailSetting.findUnique({
    where: { userId: user.id },
  });

  return NextResponse.json({
    enabled: setting?.enabled ?? false,
    recipientEmails: parseEmailList(setting?.recipientEmails ?? ""),
  });
}

export async function PATCH(req: NextRequest) {
  const { user, unauthorized } = await authenticatedAction();
  if (unauthorized) return unauthorized;

  const body = await req.json();
  const enabled = typeof body?.enabled === "boolean" ? body.enabled : undefined;
  const recipientEmailsRaw =
    typeof body?.recipientEmails === "string"
      ? body.recipientEmails
      : typeof body?.emails === "string"
        ? body.emails
        : "";

  // Allow keeping recipients empty (disabled or enabled=false).
  const recipientEmails = parseEmailList(recipientEmailsRaw);

  const current = await prisma.dailyReportEmailSetting.findUnique({
    where: { userId: user.id },
  });

  const nextEnabled = enabled ?? current?.enabled ?? false;
  const recipientEmailsStr = recipientEmails.join(",");

  await prisma.dailyReportEmailSetting.upsert({
    where: { userId: user.id },
    update: {
      enabled: nextEnabled,
      recipientEmails: recipientEmailsStr,
    },
    create: {
      userId: user.id,
      enabled: nextEnabled,
      recipientEmails: recipientEmailsStr,
    },
  });

  return NextResponse.json({ ok: true });
}

