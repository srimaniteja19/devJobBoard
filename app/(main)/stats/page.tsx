import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import {
  getApplicationStats,
  getWeeklyApplications,
  getAdvancedStats,
} from "@/lib/applications";
import StatsCharts from "@/components/stats/StatsCharts";

export default async function StatsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [stats, weekly, advanced] = await Promise.all([
    getApplicationStats(user.id),
    getWeeklyApplications(user.id),
    getAdvancedStats(user.id),
  ]);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-[28px] font-medium text-t-primary">Statistics</h1>
        <p className="text-[13px] font-light text-t-muted">
          Insights into your job search progress
        </p>
      </div>

      <StatsCharts
        byStatus={stats.byStatus}
        weeklyData={weekly}
        topStacks={advanced.topStacks}
        responseRate={advanced.responseRate}
        interviewConversion={advanced.interviewConversion}
        avgDaysToResponse={advanced.avgDaysToResponse}
      />
    </div>
  );
}
