import { unstable_cache } from "next/cache";
import { fetchAllGreenhouseJobs } from "./fetch-greenhouse";
import { fetchAllAshbyJobs } from "./fetch-ashby";

export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  description: string;
  source: "greenhouse" | "ashby" | "lever" | "custom";
  publishedAt: string;
  department?: string;
  workplaceType?: string;
  addressCountry?: string;
}

async function _fetchAllJobsUncached(): Promise<JobListing[]> {
  const [greenhouse, ashby] = await Promise.all([
    fetchAllGreenhouseJobs(),
    fetchAllAshbyJobs(),
  ]);
  return [...greenhouse, ...ashby];
}

/** Cached base jobs (15 min). Does not include user's custom careers pages. */
export const fetchAllJobsBase = unstable_cache(
  _fetchAllJobsUncached,
  ["jobs-feed-base"],
  { revalidate: 900 }
);
