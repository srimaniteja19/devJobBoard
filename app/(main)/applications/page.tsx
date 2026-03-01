import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getUserApplications } from "@/lib/applications";
import ApplicationsTable from "@/components/applications/ApplicationsTable";
import AddButton from "@/components/applications/AddButton";

export default async function ApplicationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const applications = await getUserApplications(user.id);

  const serialized = applications.map((a) => ({
    id: a.id,
    company: a.company,
    role: a.role,
    status: a.status,
    location: a.location,
    stack: a.stack,
    resumeLabel: a.resumeLabel,
    appliedAt: a.appliedAt?.toISOString() ?? null,
    updatedAt: a.updatedAt.toISOString(),
  }));

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-medium text-t-primary">Applications</h1>
          <p className="text-[13px] font-light text-t-muted">{applications.length} total</p>
        </div>
        <AddButton />
      </div>

      <ApplicationsTable applications={serialized} />
    </div>
  );
}
