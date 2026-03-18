import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import ActivityFeed from "@/components/activity/ActivityFeed";
import DailyReportEmailSettings from "@/components/dashboard/DailyReportEmailSettings";
import { getDailyReportEmailSettingForUser } from "@/lib/daily-report/getDailyReportEmailSetting";

export default async function ActivityPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const dailyReportEmailSetting = await getDailyReportEmailSettingForUser(user.id);

  const activities = await prisma.activityLog.findMany({
    where: { userId: user.id },
    include: { application: { select: { id: true, company: true, role: true, status: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const serialized = activities.map((a) => ({
    id: a.id,
    action: a.action,
    createdAt: a.createdAt.toISOString(),
    company: a.application.company,
    role: a.application.role,
    status: a.application.status,
    applicationId: a.applicationId,
  }));

  return (
    <div className="container mx-auto max-w-3xl px-4 py-4 sm:py-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-[22px] font-medium text-t-primary sm:text-[28px]">Activity</h1>
        <p className="text-[12px] font-light text-t-muted sm:text-[13px]">Your recent actions</p>
      </div>
      <div className="mb-5 sm:mb-6">
        <DailyReportEmailSettings
          initialEnabled={dailyReportEmailSetting.enabled}
          initialRecipientEmails={dailyReportEmailSetting.recipientEmails}
        />
      </div>
      <ActivityFeed activities={serialized} />
    </div>
  );
}
