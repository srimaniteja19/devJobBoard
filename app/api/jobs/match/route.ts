import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticatedAction } from "@/lib/api-auth";
import { fetchAllJobs } from "@/lib/jobs";
import { filterJobs, type DateFilterKey, type ExperienceFilterKey, type WorkType } from "@/lib/job-filters";
import type { JobListing } from "@/lib/jobs";

function parseStack(stack: string): string[] {
  try {
    const arr = JSON.parse(stack);
    return Array.isArray(arr) ? arr.map(String) : [];
  } catch {
    return [];
  }
}

/** Extract keywords from user profile (applications stack, roles) for matching. */
function getUserKeywords(apps: { stack: string; role: string }[]): string[] {
  const seen = new Set<string>();
  for (const a of apps) {
    for (const s of parseStack(a.stack)) {
      if (s.length >= 2) seen.add(s.toLowerCase());
    }
    // Add role words (e.g. "Software Engineer" -> software, engineer)
    for (const w of a.role.split(/\s+/)) {
      if (w.length >= 3) seen.add(w.toLowerCase());
    }
  }
  return Array.from(seen);
}

/** Simple keyword match score: how many user keywords appear in job text. */
function scoreJob(
  job: JobListing,
  keywords: string[],
  appliedCompanyNames: Set<string>
): { score: number; matchedSkills: string[] } {
  if (keywords.length === 0) {
    return { score: 0, matchedSkills: [] };
  }

  const text = `${job.title} ${job.description} ${job.department ?? ""}`.toLowerCase();
  const matched: string[] = [];

  for (const kw of keywords) {
    // Whole word or common variations (e.g. "react" matches "reactjs")
    const re = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[a-z]*\\b`, "i");
    if (re.test(text)) matched.push(kw);
  }

  const score = matched.length / keywords.length;
  // Bonus: haven't applied to this company
  const notApplied = !appliedCompanyNames.has(job.company.toLowerCase()) ? 1.1 : 1;
  return { score: Math.min(1, score * notApplied), matchedSkills: matched };
}

export async function POST(req: NextRequest) {
  const { user, unauthorized } = await authenticatedAction();
  if (unauthorized) return unauthorized;

  try {
    const body = await req.json().catch(() => ({}));
    const limit = Math.min(100, Math.max(10, Number(body.limit) || 30));
    const usaOnly = body.usaOnly !== false;
    const workTypes = Array.isArray(body.workTypes)
      ? (body.workTypes.filter((w: unknown) =>
          ["remote", "hybrid", "onsite"].includes(String(w))
        ) as WorkType[])
      : (["remote", "hybrid", "onsite"] as WorkType[]);
    const datePosted = body.datePosted as DateFilterKey | undefined;
    const experience = body.experience as ExperienceFilterKey | undefined;

    // Get user's applications for keywords + applied companies
    const apps = await prisma.application.findMany({
      where: { userId: user.id },
      select: { stack: true, role: true, company: true },
    });

    const keywords = getUserKeywords(apps);
    const appliedCompanies = new Set(
      apps.map((a) => a.company.toLowerCase().trim())
    );

    // Add explicit skills from body if provided
    const bodySkills = body.skills;
    if (Array.isArray(bodySkills)) {
      for (const s of bodySkills) {
        if (typeof s === "string" && s.length >= 2) {
          keywords.push(s.toLowerCase());
        }
      }
    }

    const allJobs = await fetchAllJobs();
    const jobs = filterJobs(allJobs, { usaOnly, workTypes, datePosted, experience });

    const scored = jobs.map((job) => {
      const { score, matchedSkills } = scoreJob(job, keywords, appliedCompanies);
      return { job, score, matchedSkills };
    });

    const filtered = scored
      .filter((s) => s.score > 0 || keywords.length === 0)
      .sort((a, b) => {
        if (keywords.length === 0) {
          return new Date(b.job.publishedAt).getTime() - new Date(a.job.publishedAt).getTime();
        }
        return b.score - a.score;
      })
      .slice(0, limit)
      .map(({ job, score, matchedSkills }) => ({
        ...job,
        matchScore: Math.round(score * 100),
        matchReason:
          matchedSkills.length > 0
            ? `Matches: ${matchedSkills.slice(0, 5).join(", ")}`
            : keywords.length > 0
              ? "Based on role"
              : "Recently posted",
      }));

    return NextResponse.json({
      jobs: filtered,
      total: jobs.length,
      totalBeforeFilters: allJobs.length,
      keywordsUsed: keywords.slice(0, 20),
    });
  } catch (e) {
    console.error("Jobs match error:", e);
    return NextResponse.json(
      { error: "Failed to match jobs", jobs: [] },
      { status: 500 }
    );
  }
}
