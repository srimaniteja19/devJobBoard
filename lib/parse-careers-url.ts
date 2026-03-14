/**
 * Parse careers page URLs to extract board token for supported platforms.
 * Supports: Greenhouse, Ashby, Lever. Unknown URLs return "custom".
 */

export type CareersSource = "greenhouse" | "ashby" | "lever" | "custom";

export interface ParsedCareersUrl {
  source: CareersSource;
  boardToken: string;
  company?: string;
}

export function parseCareersUrl(url: string): ParsedCareersUrl {
  if (!url || url.length < 10) {
    return { source: "custom", boardToken: "", company: undefined };
  }
  let normalized = url.trim();
  if (!normalized.startsWith("http")) normalized = `https://${normalized}`;
  try {
    const u = new URL(normalized);
    const host = u.hostname.toLowerCase();
    const path = u.pathname.replace(/^\/+|\/+$/g, "");

    // Greenhouse: boards.greenhouse.io/TOKEN or api.greenhouse.io/v1/boards/TOKEN
    if (host.includes("greenhouse.io")) {
      let token = "";
      if (path.startsWith("v1/boards/")) {
        token = path.replace("v1/boards/", "").split("/")[0];
      } else {
        token = path.split("/")[0];
      }
      if (token && token.length >= 2 && !/^\d+$/.test(token)) {
        return { source: "greenhouse", boardToken: token };
      }
    }

    // Ashby: jobs.ashbyhq.com/BOARD_NAME
    if (host.includes("ashbyhq.com")) {
      const name = path.split("/")[0].trim();
      if (name && name.length >= 2) {
        return { source: "ashby", boardToken: name };
      }
    }

    // Lever: jobs.lever.co/COMPANY
    if (host.includes("lever.co")) {
      const slug = path.split("/")[0].trim();
      if (slug && slug.length >= 2) {
        return { source: "lever", boardToken: slug };
      }
    }

    // Any other URL: store as custom (boardToken = normalized URL for uniqueness)
    return { source: "custom", boardToken: normalized };
  } catch {
    return { source: "custom", boardToken: url.trim() };
  }
}

/** Returns true if we can fetch jobs from this source */
export function canFetchJobs(source: CareersSource): boolean {
  return source === "greenhouse" || source === "ashby" || source === "lever";
}

/** Infer company name from board token (e.g. "stripe" -> "Stripe") */
export function tokenToCompanyName(token: string): string {
  return token
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
