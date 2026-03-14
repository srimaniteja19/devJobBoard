/**
 * Job filtering: USA only, work type (onsite/hybrid/remote), date posted.
 */

import type { JobListing } from "./jobs";

/** Work types we support */
export type WorkType = "remote" | "hybrid" | "onsite";

/** Experience filter: [minYears, maxYears] (null = no filter) */
export const EXPERIENCE_FILTERS = {
  any: null,
  "0-1": [0, 1] as const,
  "1-3": [1, 3] as const,
  "1-5": [1, 5] as const,
  "3-5": [3, 5] as const,
  "5+": [5, 20] as const,
} as const;

export type ExperienceFilterKey = keyof typeof EXPERIENCE_FILTERS;

/** Date filter presets (hours ago) */
export const DATE_FILTERS = {
  "1h": 1,
  "2h": 2,
  "6h": 6,
  "24h": 24,
  "3d": 72,
  "1w": 168,
} as const;

export type DateFilterKey = keyof typeof DATE_FILTERS;

/** USA indicators in location/description */
const USA_PATTERNS = [
  /\b(usa|us)\b/i,
  /\bunited states\b/i,
  /\bremote\b/i,
  /\b(california|new york|texas|washington|florida|illinois|massachusetts|colorado|georgia|north carolina|arizona|virginia|pennsylvania|ohio|michigan|oregon|minnesota|maryland|tennessee|indiana|new jersey|north carolina|colorado)\b/i,
  /\b(sf|nyc|bay area|silicon valley|seattle|austin|boston|denver|la|los angeles)\b/i,
  /,\s*(ca|ny|tx|wa|fl|il|ma|co|ga|nc|az|va|pa|oh|mi|or|mn|md|tn|in|nj)\b/i,
];

/** Non-USA indicators – exclude if present and no USA context */
const NON_USA_PATTERNS = [
  /\b(uk|united kingdom)\b/i,
  /\b(london|manchester)\s*(,|$)/i,
  /\b(europe|emea)\b/i,
  /\b(germany|france|spain|italy|netherlands)\b/i,
  /\b(canada|toronto|vancouver)\b/i,
  /\b(india|bangalore|mumbai|hyderabad)\b/i,
  /\b(australia|sydney|melbourne)\b/i,
  /\b(singapore|apac)\b/i,
];

/** Infer work type from location string */
function inferWorkType(location: string, workplaceType?: string): WorkType | "unknown" {
  const loc = location.toLowerCase();
  if (workplaceType) {
    const wt = workplaceType.toLowerCase();
    if (wt.includes("remote")) return "remote";
    if (wt.includes("hybrid")) return "hybrid";
    if (wt.includes("onsite") || wt.includes("on-site")) return "onsite";
  }
  if (/\bremote\b/i.test(loc)) return "remote";
  if (/\bhybrid\b/i.test(loc)) return "hybrid";
  if (/\b(on-?site|office)\b/i.test(loc)) return "onsite";
  if (/,?\s*(ca|ny|tx|wa|fl|il|ma|co|ga|nc|az|va|pa|oh|mi|or|mn|md|tn|in|nj)\s*,?/i.test(loc)) return "onsite";
  if (loc.includes("san francisco") || loc.includes("new york") || loc.includes("seattle")) return "onsite";
  return "unknown";
}

/** True if job appears USA-based */
export function isUSAJob(job: JobListing): boolean {
  const loc = (job.location ?? "").toLowerCase().trim();
  const country = (job as { addressCountry?: string }).addressCountry ?? "";

  if (country && !/^(usa?|united states)$/i.test(country)) return false;

  for (const p of NON_USA_PATTERNS) {
    if (p.test(loc)) return false;
  }

  for (const p of USA_PATTERNS) {
    if (p.test(loc)) return true;
  }

  if (country && /^(usa?|united states)$/i.test(country)) return true;

  if ((!loc || loc === "unknown") && !country) return true;
  return false;
}

/** True if job's work type is in the allowed list */
export function matchesWorkType(job: JobListing, allowed: WorkType[]): boolean {
  const wt = inferWorkType(job.location, (job as { workplaceType?: string }).workplaceType);
  if (wt === "unknown") return true;
  return allowed.includes(wt);
}

/** Extract min/max years from job title + description. Returns [min, max] or null if unparseable. */
function parseExperienceYears(job: JobListing): { min: number; max: number } | null {
  const text = `${job.title} ${job.description}`.toLowerCase();

  const xPlusMatch = text.match(/(\d+)\s*\+\s*years?/i) || text.match(/(\d+)\s*\+\s*yrs?/i);
  if (xPlusMatch) {
    const min = parseInt(xPlusMatch[1], 10);
    return { min, max: 20 };
  }

  const rangeMatch = text.match(/(\d+)\s*[-–to]\s*(\d+)\s*years?/i) || text.match(/(\d+)\s*[-–]\s*(\d+)\s*years?/i);
  if (rangeMatch) {
    const a = parseInt(rangeMatch[1], 10);
    const b = parseInt(rangeMatch[2], 10);
    return { min: Math.min(a, b), max: Math.max(a, b) };
  }

  if (/\b(entry\s*level|0\s*[-–]?\s*1\s*year)/i.test(text)) return { min: 0, max: 1 };
  if (/\b(junior|jr\.?)\b/i.test(text)) return { min: 0, max: 2 };
  if (/\bmid[- ]?level\b/i.test(text)) return { min: 2, max: 5 };
  if (/\b(senior|sr\.?)\b/i.test(text)) return { min: 5, max: 20 };
  if (/\b(lead|principal|staff)\b/i.test(text)) return { min: 7, max: 20 };

  return null;
}

/** True if job's experience requirement overlaps with [userMin, userMax] */
export function matchesExperience(
  job: JobListing,
  userMin: number,
  userMax: number
): boolean {
  const parsed = parseExperienceYears(job);
  if (!parsed) return true;
  return parsed.min <= userMax && parsed.max >= userMin;
}

/** True if job was posted within the given hours */
export function withinHours(job: JobListing, hours: number): boolean {
  const posted = new Date(job.publishedAt).getTime();
  const cutoff = Date.now() - hours * 60 * 60 * 1000;
  return posted >= cutoff;
}

/** Apply all filters */
export function filterJobs(
  jobs: JobListing[],
  opts: {
    usaOnly?: boolean;
    workTypes?: WorkType[];
    datePosted?: DateFilterKey;
    experience?: ExperienceFilterKey;
  }
): JobListing[] {
  let result = jobs;

  if (opts.usaOnly !== false) {
    result = result.filter(isUSAJob);
  }

  if (opts.workTypes && opts.workTypes.length > 0) {
    result = result.filter((j) => matchesWorkType(j, opts.workTypes!));
  }

  if (opts.datePosted && opts.datePosted in DATE_FILTERS) {
    const hours = DATE_FILTERS[opts.datePosted as DateFilterKey];
    result = result.filter((j) => withinHours(j, hours));
  }

  if (opts.experience && opts.experience !== "any" && opts.experience in EXPERIENCE_FILTERS) {
    const range = EXPERIENCE_FILTERS[opts.experience as ExperienceFilterKey];
    if (range) {
      const [userMin, userMax] = range;
      result = result.filter((j) => matchesExperience(j, userMin, userMax));
    }
  }

  return result;
}
