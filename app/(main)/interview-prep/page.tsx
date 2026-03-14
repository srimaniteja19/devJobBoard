import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import InterviewPrepClient from "./InterviewPrepClient";

export default async function InterviewPrepPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-[calc(100vh-3rem)] bg-prep-bg">
      <div className="container mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <div className="mb-10">
          <h1 className="text-2xl font-semibold tracking-tight text-prep-text sm:text-3xl">
            FAANG+ Interview Prep
          </h1>
          <p className="mt-2 text-[15px] text-prep-text-secondary">
            Interview processes, tips, and prep guides for 10 top tech companies
          </p>
        </div>
        <InterviewPrepClient />
      </div>
    </div>
  );
}
