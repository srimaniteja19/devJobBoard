import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getUserApplications } from "@/lib/applications";
import ApplicationsPageContent from "@/components/applications/ApplicationsPageContent";
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
    <div className="container mx-auto max-w-6xl px-4 py-4 sm:py-6">
      <div className="mb-4 flex items-center justify-between sm:mb-6">
        <div>
          <h1 className="text-[22px] font-medium text-t-primary sm:text-[28px]">Applications</h1>
          <p className="text-[12px] font-light text-t-muted sm:text-[13px]">{applications.length} total</p>
        </div>
        <div className="hidden sm:block">
          <AddButton />
        </div>
      </div>

      <ApplicationsPageContent applications={serialized} />
    </div>
  );
}
