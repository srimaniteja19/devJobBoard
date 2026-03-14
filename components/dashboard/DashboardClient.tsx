"use client";

import { useDashboardTheme, useDashboardNotes, useDashboardMetrics } from "./DashboardPreferences";
import ThemeSelector from "./ThemeSelector";
import DashboardNotes from "./DashboardNotes";
import TodaysFocusCard from "./TodaysFocusCard";
import StatsBarWithSettings from "./StatsBarWithSettings";
import FollowUpReminders from "./FollowUpReminders";
import KanbanBoard from "./KanbanBoard";
import ActivityByPeriod from "./ActivityByPeriod";
import AddButton from "@/components/applications/AddButton";

interface Reminder {
  id: string;
  company: string;
  role: string;
  followUpDate: string;
}

interface AppItem {
  id: string;
  company: string;
  role: string;
  status: string;
  appliedAt: string | null;
  createdAt: string;
  resumeMatchScore: number | null;
  resumeMatchCriticalCount: number;
}

interface ActivityData {
  [status: string]: { today: number; week: number; month: number };
}

interface DashboardClientProps {
  reminders: Reminder[];
  applications: AppItem[];
  stats: { total: number; active: number; interviews: number; offers: number; rejectionRate: number };
  streak: number;
  activityByPeriod: ActivityData;
}

export default function DashboardClient({
  reminders,
  applications,
  stats,
  streak,
  activityByPeriod,
}: DashboardClientProps) {
  const [theme, setTheme] = useDashboardTheme();
  const [notes, setNotes] = useDashboardNotes();
  const [visibleMetrics, setVisibleMetrics] = useDashboardMetrics();

  const appliedToday = activityByPeriod.APPLIED?.today ?? 0;

  return (
    <div id="dashboard-root" className="container mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 sm:mb-8">
        <h1
          className="text-2xl font-semibold tracking-tight sm:text-3xl"
          style={{ color: "var(--dash-card-company)" }}
        >
          Dashboard
        </h1>
        <div className="flex items-center gap-2">
          <ThemeSelector value={theme} onChange={setTheme} />
          <div className="hidden sm:block">
            <AddButton />
          </div>
        </div>
      </div>

      <TodaysFocusCard
        reminders={reminders}
        streak={streak}
        appliedToday={appliedToday}
        total={stats.total}
      />

      <div className="mt-6 space-y-6">
          <div className="grid gap-5 lg:grid-cols-[1fr_300px] lg:items-start">
            <div className="min-w-0">
              <StatsBarWithSettings
                total={stats.total}
                active={stats.active}
                interviews={stats.interviews}
                offers={stats.offers}
                rejectionRate={stats.rejectionRate}
                streak={streak}
                visibleMetrics={visibleMetrics}
                onMetricsChange={setVisibleMetrics}
              />
            </div>
            <div className="min-w-0">
              <DashboardNotes value={notes} onChange={setNotes} />
            </div>
          </div>

          <div className="space-y-5">
            <FollowUpReminders reminders={reminders} />
            <KanbanBoard applications={applications} />
            <ActivityByPeriod data={activityByPeriod} />
          </div>
        </div>
    </div>
  );
}
