import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getUserApplications, getApplicationStats, getFollowUpReminders, getApplicationStreak, getActivityByPeriod } from "@/lib/applications";
import StatsBar from "@/components/dashboard/StatsBar";
import ActivityByPeriod from "@/components/dashboard/ActivityByPeriod";
import KanbanBoard from "@/components/dashboard/KanbanBoard";
import FollowUpReminders from "@/components/dashboard/FollowUpReminders";
import AddButton from "@/components/applications/AddButton";

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
    followUpDate: f.followUpDate!.toISOString().slice(0, 10),
  }));

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <div className="mb-6 flex items-center justify-between sm:mb-8">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl" style={{ color: "var(--dash-card-company)" }}>
          Dashboard
        </h1>
        <div className="hidden sm:block">
          <AddButton />
        </div>
      </div>

      <StatsBar
        total={stats.total}
        active={stats.active}
        interviews={stats.interviews}
        offers={stats.offers}
        rejectionRate={stats.rejectionRate}
        streak={streak}
      />

      <ActivityByPeriod data={activityByPeriod} />

      <div className="mt-4 sm:mt-6">
        <FollowUpReminders reminders={reminders} />
        <KanbanBoard applications={serialized} />
      </div>
    </div>
  );
}
