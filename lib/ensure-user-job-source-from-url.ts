import { prisma } from "./db";
import {
  parseCareersUrl,
  canFetchJobs,
  tokenToCompanyName,
  type CareersSource,
} from "./parse-careers-url";

function boardCareersUrl(source: CareersSource, boardToken: string): string {
  if (source === "greenhouse") return `https://boards.greenhouse.io/${boardToken}`;
  if (source === "ashby") return `https://jobs.ashbyhq.com/${boardToken}`;
  if (source === "lever") return `https://jobs.lever.co/${boardToken}`;
  return "";
}

/**
 * If the job URL is a Greenhouse / Ashby / Lever board, ensure the user has that
 * source tracked so fetchUserJobSourcesJobs can pull listings.
 */
export async function ensureUserJobSourceFromJobUrl(params: {
  userId: string;
  jobUrl: string;
  companyName: string;
}): Promise<{ added: boolean }> {
  const parsed = parseCareersUrl(params.jobUrl);
  if (!canFetchJobs(parsed.source)) return { added: false };

  const boardToken = parsed.boardToken;
  if (!boardToken) return { added: false };

  const existing = await prisma.userJobSource.findFirst({
    where: {
      userId: params.userId,
      source: parsed.source,
      boardToken,
    },
  });
  if (existing) return { added: false };

  const displayCompany =
    params.companyName.trim() || tokenToCompanyName(boardToken);

  await prisma.userJobSource.create({
    data: {
      userId: params.userId,
      company: displayCompany,
      source: parsed.source,
      boardToken,
      careersUrl: boardCareersUrl(parsed.source, boardToken),
    },
  });

  return { added: true };
}
