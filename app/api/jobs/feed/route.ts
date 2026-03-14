import { NextResponse } from "next/server";
import { fetchAllJobsBase } from "@/lib/jobs";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const jobs = await fetchAllJobsBase();
    return NextResponse.json({ jobs, total: jobs.length });
  } catch (e) {
    console.error("Jobs feed error:", e);
    return NextResponse.json(
      { error: "Failed to fetch jobs", jobs: [], total: 0 },
      { status: 500 }
    );
  }
}
