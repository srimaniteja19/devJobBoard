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
  source: "greenhouse" | "ashby";
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

/** Cached for 15 min – first load fetches, subsequent loads hit cache */
export const fetchAllJobs = unstable_cache(
  _fetchAllJobsUncached,
  ["jobs-feed"],
  { revalidate: 900 }
);
