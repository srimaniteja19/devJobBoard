import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import MatchedJobsList from "@/components/jobs/MatchedJobsList";

export default async function JobsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="jobs-tab min-h-[calc(100vh-3rem)] bg-jobs-bg">
      <div className="container mx-auto max-w-7xl px-4 py-6 sm:py-8">
        <div className="mb-6">
          <h1 className="text-[24px] font-medium text-jobs-text sm:text-[28px]">
            Matched Jobs
          </h1>
          <p className="mt-1 text-[13px] font-light text-jobs-muted">
            Jobs from Greenhouse & Ashby matched to your skills and experience
          </p>
        </div>

        <MatchedJobsList />
      </div>
    </div>
  );
}
