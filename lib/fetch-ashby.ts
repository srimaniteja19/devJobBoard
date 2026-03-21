import { ASHBY_BOARDS } from "./job-sources";
import { filterToEngineeringRoles } from "./job-filters";

interface AshbyAddress {
  postalAddress?: {
    addressCountry?: string;
  };
}

export interface AshbyJob {
  id?: string;
  title: string;
  location?: string;
  department?: string;
  descriptionPlain?: string;
  descriptionHtml?: string;
  jobUrl?: string;
  applyUrl?: string;
  publishedAt?: string;
  isRemote?: boolean;
  workplaceType?: string;
  address?: AshbyAddress;
}

export interface AshbyResponse {
  jobs?: AshbyJob[];
}

export interface NormalizedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  description: string;
  source: "ashby";
  publishedAt: string;
  department?: string;
}

const FETCH_TIMEOUT_MS = 4000;

async function fetchBoard(
  boardName: string,
  company: string
): Promise<NormalizedJob[]> {
  const url = `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(boardName)}`;
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

  const data = (await res.json()) as AshbyResponse;
  const rawJobs = data.jobs ?? [];

  return rawJobs.map((j, idx) => {
    let location = j.location ?? "";
    if (j.isRemote) location = location ? `${location} · Remote` : "Remote";
    const country = j.address?.postalAddress?.addressCountry ?? "";
    return {
      id: j.id ? `ashby-${boardName}-${j.id}` : `ashby-${boardName}-${idx}`,
      title: j.title ?? "Untitled",
      company,
      location: location || "Unknown",
      url: j.jobUrl ?? j.applyUrl ?? `https://jobs.ashbyhq.com/${boardName}`,
      description: j.descriptionPlain ?? j.descriptionHtml ?? "",
      source: "ashby" as const,
      publishedAt: j.publishedAt ?? new Date().toISOString(),
      department: j.department,
      workplaceType: j.workplaceType,
      addressCountry: country || undefined,
    };
  });
  } catch {
    clearTimeout(timeout);
    return [];
  }
}

export async function fetchAllAshbyJobs(): Promise<NormalizedJob[]> {
  return fetchAshbyFromBoards(ASHBY_BOARDS);
}

export async function fetchAshbyFromBoards(
  boards: { name: string; company: string }[]
): Promise<NormalizedJob[]> {
  const results = await Promise.allSettled(
    boards.map((b) => fetchBoard(b.name, b.company))
  );
  const jobs: NormalizedJob[] = [];
  for (const r of results) {
    if (r.status === "fulfilled" && Array.isArray(r.value)) {
      jobs.push(...r.value);
    }
  }
  return filterToEngineeringRoles(jobs);
}
