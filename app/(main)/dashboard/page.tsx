import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getUserApplications, getApplicationStats } from "@/lib/applications";
import StatsBar from "@/components/dashboard/StatsBar";
import KanbanBoard from "@/components/dashboard/KanbanBoard";
import AddButton from "@/components/applications/AddButton";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [applications, stats] = await Promise.all([
    getUserApplications(user.id),
    getApplicationStats(user.id),
  ]);

  const serialized = applications.map((a) => ({
    id: a.id,
    company: a.company,
    role: a.role,
    status: a.status,
    appliedAt: a.appliedAt?.toISOString() ?? null,
    createdAt: a.createdAt.toISOString(),
  }));

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-[28px] font-medium text-t-primary">Dashboard</h1>
        <AddButton />
      </div>

      <StatsBar
        total={stats.total}
        active={stats.active}
        interviews={stats.interviews}
        offers={stats.offers}
        rejectionRate={stats.rejectionRate}
      />

      <div className="mt-6">
        <KanbanBoard applications={serialized} />
      </div>
    </div>
  );
}
