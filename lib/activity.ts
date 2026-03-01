import { prisma } from "@/lib/db";

export async function logActivity(
  userId: string,
  applicationId: string,
  action: string
) {
  try {
    await prisma.activityLog.create({
      data: { userId, applicationId, action },
    });
  } catch {
    // Non-critical — don't fail the parent operation
  }
}
