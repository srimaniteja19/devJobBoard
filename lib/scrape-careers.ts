/**
 * Minimal scraper for custom careers URLs.
 * Fetches page and extracts jobs from JSON-LD JobPosting schema (used by many career sites for SEO).
 */

import type { JobListing } from "./jobs";
import { filterToEngineeringRoles } from "./job-filters";

const FETCH_TIMEOUT_MS = 6000;

interface JsonLdJobPosting {
  "@type"?: string;
  title?: string;
  description?: string;
  datePosted?: string;
  url?: string;
  hiringOrganization?: { name?: string; "@type"?: string };
  jobLocation?: { name?: string; address?: { addressLocality?: string; addressCountry?: string } };
}

function extractJsonLd(html: string): unknown[] {
  const scripts: unknown[] = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(m[1].trim());
      scripts.push(parsed);
    } catch {
      // skip invalid JSON
    }
  }
  return scripts;
}

function flattenJobPostings(data: unknown, out: JsonLdJobPosting[]): void {
  if (!data || typeof data !== "object") return;
  const obj = data as Record<string, unknown>;
  const type = obj["@type"];
  if (type === "JobPosting") {
    out.push(obj as unknown as JsonLdJobPosting);
    return;
  }
  if (type === "ItemList" && Array.isArray(obj.itemListElement)) {
    for (const item of obj.itemListElement) {
      flattenJobPostings(item, out);
    }
    return;
  }
  if (Array.isArray(obj["@graph"])) {
    for (const g of obj["@graph"] as unknown[]) {
      flattenJobPostings(g, out);
    }
    return;
  }
}

export async function scrapeCareersPage(
  url: string,
  company: string
): Promise<JobListing[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; devJobBoard/1.0; +https://example.com)",
      },
      signal: controller.signal,
      next: { revalidate: 3600 },
    });
    clearTimeout(timeout);
    if (!res.ok) return [];

    const html = await res.text();
    const blocks = extractJsonLd(html);
    const postings: JsonLdJobPosting[] = [];

    for (const block of blocks) {
      flattenJobPostings(block, postings);
    }

    const baseUrl = new URL(url);
    const jobs: JobListing[] = postings
      .filter((p) => p.title)
      .map((p, idx) => {
        const loc = p.jobLocation?.name ?? p.jobLocation?.address?.addressLocality ?? "Unknown";
        const orgName = p.hiringOrganization?.name ?? company;
        let jobUrl = p.url ?? "";
        if (!jobUrl.startsWith("http")) {
          jobUrl = jobUrl.startsWith("/") ? `${baseUrl.origin}${jobUrl}` : url;
        }
        return {
          id: `scrape-${company}-${idx}-${(p.title ?? "").slice(0, 20).replace(/\W/g, "")}`,
          title: p.title ?? "Untitled",
          company: orgName,
          location: loc,
          url: jobUrl,
          description: p.description ?? "",
          source: "custom" as const,
          publishedAt: p.datePosted ?? new Date().toISOString(),
        };
      });

    return filterToEngineeringRoles(jobs);
  } catch {
    clearTimeout(timeout);
    return [];
  }
}
