import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getUserApplications, getApplicationStats, getFollowUpReminders, getApplicationStreak, getActivityByPeriod } from "@/lib/applications";
import DashboardClient from "@/components/dashboard/DashboardClient";
import { toYMDLocal } from "@/lib/date-helpers";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [applications, stats, followUps, streak, activityByPeriod] = await Promise.all([
    getUserApplications(user.id),
    getApplicationStats(user.id),
    getFollowUpReminders(user.id),
    getApplicationStreak(user.id),
    getActivityByPeriod(user.id),
  ]);

  const serialized = applications.map((a) => ({
    id: a.id,
    company: a.company,
    role: a.role,
    status: a.status,
    appliedAt: a.appliedAt?.toISOString() ?? null,
    createdAt: a.createdAt.toISOString(),
    resumeMatchScore:
      a.status === "WISHLIST" && a.resumeMatch
        ? a.resumeMatch.overallScore
        : null,
    resumeMatchCriticalCount:
      a.status === "WISHLIST" && a.resumeMatch
        ? (() => {
            try {
              const r = JSON.parse(a.resumeMatch.result) as { criticalIssues?: unknown[] };
              return r?.criticalIssues?.length ?? 0;
            } catch {
              return 0;
            }
          })()
        : 0,
  }));

  const reminders = followUps.map((f) => ({
    id: f.id,
    company: f.company,
    role: f.role,
    followUpDate: toYMDLocal(f.followUpDate!),
  }));

  return (
    <DashboardClient
      reminders={reminders}
      applications={serialized}
      stats={{
        total: stats.total,
        active: stats.active,
        interviews: stats.interviews,
        offers: stats.offers,
        rejectionRate: stats.rejectionRate,
      }}
      streak={streak}
      activityByPeriod={activityByPeriod}
    />
  );
}
