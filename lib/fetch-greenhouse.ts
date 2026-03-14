import { GREENHOUSE_BOARDS } from "./job-sources";

export interface GreenhouseJob {
  id: number;
  title: string;
  location: { name: string };
  absolute_url: string;
  updated_at: string;
  content?: string;
  departments?: { name: string }[];
}

export interface GreenhouseResponse {
  jobs: GreenhouseJob[];
  meta?: { total: number };
}

export interface NormalizedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  description: string;
  source: "greenhouse";
  publishedAt: string;
  department?: string;
}

const FETCH_TIMEOUT_MS = 4000;

async function fetchBoard(
  token: string,
  company: string
): Promise<NormalizedJob[]> {
  const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(token)}/jobs?content=true`;
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

  const data = (await res.json()) as GreenhouseResponse;
  const jobs = data.jobs ?? [];

  return jobs.map((j) => ({
    id: `gh-${token}-${j.id}`,
    title: j.title ?? "",
    company,
    location: j.location?.name ?? "Unknown",
    url: j.absolute_url ?? "",
    description: j.content ?? "",
    source: "greenhouse" as const,
    publishedAt: j.updated_at ?? new Date().toISOString(),
    department: j.departments?.[0]?.name,
  }));
  } catch {
    clearTimeout(timeout);
    return [];
  }
}

export async function fetchAllGreenhouseJobs(): Promise<NormalizedJob[]> {
  const results = await Promise.allSettled(
    GREENHOUSE_BOARDS.map((b) => fetchBoard(b.token, b.company))
  );

  const jobs: NormalizedJob[] = [];
  for (const r of results) {
    if (r.status === "fulfilled" && Array.isArray(r.value)) {
      jobs.push(...r.value);
    }
  }
  return jobs;
}
