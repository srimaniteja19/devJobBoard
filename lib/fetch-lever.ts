/** Fetch jobs from Lever postings API (public, no auth). */

import { LEVER_BOARDS } from "./job-sources";
import { filterToEngineeringRoles } from "./job-filters";

interface LeverJob {
  id?: string;
  text?: string;
  hostedUrl?: string;
  createdAt?: number;
  categories?: {
    location?: string;
    department?: string;
    commitment?: string;
    team?: string;
  };
  descriptionPlain?: string;
  description?: string;
}

export interface NormalizedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  description: string;
  source: "lever";
  publishedAt: string;
  department?: string;
}

const FETCH_TIMEOUT_MS = 4000;

async function fetchBoard(slug: string, company: string): Promise<NormalizedJob[]> {
  const url = `https://api.lever.co/v0/postings/${encodeURIComponent(slug)}?mode=json`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
      next: { revalidate: 3600 },
    });
    clearTimeout(timeout);
    if (!res.ok) return [];

    const data = (await res.json()) as LeverJob[];
    const jobs = Array.isArray(data) ? data : [];

    return jobs.map((j, idx) => {
      const id = j.id ?? `lever-${slug}-${idx}`;
      const location = j.categories?.location ?? "Unknown";
      return {
        id: `lever-${slug}-${id}`,
        title: j.text ?? "Untitled",
        company,
        location,
        url: j.hostedUrl ?? `https://jobs.lever.co/${slug}`,
        description: j.descriptionPlain ?? j.description ?? "",
        source: "lever" as const,
        publishedAt: j.createdAt
          ? new Date(j.createdAt).toISOString()
          : new Date().toISOString(),
        department: j.categories?.department,
      };
    });
  } catch {
    clearTimeout(timeout);
    return [];
  }
}

export async function fetchLeverFromBoards(
  boards: { slug: string; company: string }[]
): Promise<NormalizedJob[]> {
  if (boards.length === 0) return [];
  const results = await Promise.allSettled(
    boards.map((b) => fetchBoard(b.slug, b.company))
  );
  const jobs: NormalizedJob[] = [];
  for (const r of results) {
    if (r.status === "fulfilled" && Array.isArray(r.value)) {
      jobs.push(...r.value);
    }
  }
  return filterToEngineeringRoles(jobs);
}

export async function fetchAllLeverJobs(): Promise<NormalizedJob[]> {
  return fetchLeverFromBoards(LEVER_BOARDS);
}
