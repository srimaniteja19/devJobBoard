import { prisma } from "./db";
import { fetchGreenhouseFromBoards } from "./fetch-greenhouse";
import { fetchAshbyFromBoards } from "./fetch-ashby";
import { fetchLeverFromBoards } from "./fetch-lever";
import { scrapeCareersPage } from "./scrape-careers";
import type { JobListing } from "./jobs";

export async function fetchUserJobSourcesJobs(userId: string): Promise<JobListing[]> {
  const sources = await prisma.userJobSource.findMany({
    where: { userId },
  });
  const apiSources = sources.filter(
    (s) => s.source === "greenhouse" || s.source === "ashby" || s.source === "lever"
  );
  const customSources = sources.filter(
    (s) => s.source === "custom" && s.careersUrl
  );

  const [apiJobs, scrapedJobs] = await Promise.all([
    fetchApiJobs(apiSources),
    customSources.length > 0
      ? Promise.all(
          customSources.map((s) =>
            scrapeCareersPage(s.careersUrl!, s.company)
          )
        ).then((arr) => arr.flat())
      : [],
  ]);

  return [...apiJobs, ...scrapedJobs];
}

async function fetchApiJobs(
  sources: { source: string; boardToken: string; company: string }[]
): Promise<JobListing[]> {
  if (sources.length === 0) return [];
  const gh = sources.filter((s) => s.source === "greenhouse");
  const ashby = sources.filter((s) => s.source === "ashby");
  const lever = sources.filter((s) => s.source === "lever");

  const [ghJobs, ashbyJobs, leverJobs] = await Promise.all([
    gh.length > 0
      ? fetchGreenhouseFromBoards(
          gh.map((s) => ({ token: s.boardToken, company: s.company }))
        )
      : [],
    ashby.length > 0
      ? fetchAshbyFromBoards(
          ashby.map((s) => ({ name: s.boardToken, company: s.company }))
        )
      : [],
    lever.length > 0
      ? fetchLeverFromBoards(
          lever.map((s) => ({ slug: s.boardToken, company: s.company }))
        )
      : [],
  ]);

  return [...ghJobs, ...ashbyJobs, ...leverJobs];
}
