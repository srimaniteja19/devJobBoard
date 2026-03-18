import { prisma } from "@/lib/db";

function parseEmailList(input: string): string[] {
  return input
    .split(/[,\n;\r\t ]+/g)
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
}

export async function getDailyReportEmailSettingForUser(userId: string): Promise<{
  enabled: boolean;
  recipientEmails: string[];
}> {
  const setting = await prisma.dailyReportEmailSetting.findUnique({ where: { userId } });
  if (!setting) return { enabled: false, recipientEmails: [] };
  return {
    enabled: setting.enabled,
    recipientEmails: parseEmailList(setting.recipientEmails ?? ""),
  };
}

