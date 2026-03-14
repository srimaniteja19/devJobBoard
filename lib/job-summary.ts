/** Generate a one-line TL;DR for a job posting. */

const TECH_KEYWORDS = [
  "react", "vue", "angular", "typescript", "javascript", "python", "go", "rust", "java", "kotlin",
  "node", "graphql", "sql", "aws", "kubernetes", "docker", "terraform", "redis", "postgres",
  "mongodb", "machine learning", "ml", "ai", "llm", "frontend", "backend", "full stack", "fullstack",
  "devops", "sre", "data engineer", "product", "design", "figma",
];

function extractTech(text: string): string[] {
  const lower = text.toLowerCase();
  const found: string[] = [];
  for (const kw of TECH_KEYWORDS) {
    const re = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (re.test(lower)) found.push(kw);
  }
  return Array.from(new Set(found)).slice(0, 4);
}

function extractSalary(text: string): string | null {
  const m = text.match(/\$[\d,]+(?:k|K)?\s*[-–—]\s*\$[\d,]+(?:k|K)?/);
  if (m) return m[0];
  const m2 = text.match(/\$[\d,]+(?:k|K)?\s*\+/);
  if (m2) return m2[0] + "+";
  const m3 = text.match(/\$\d{2,3}k/);
  if (m3) return m3[0];
  return null;
}

function inferWorkType(location: string): string {
  const loc = location.toLowerCase();
  if (/\bremote\b/.test(loc)) return "Remote";
  if (/\bhybrid\b/.test(loc)) return "Hybrid";
  const city = loc.match(/(?:new york|nyc|sf|san francisco|seattle|boston|austin|la|los angeles|chicago|denver)\b/);
  if (city) return city[0].replace(/\bnyc\b/i, "NYC").replace(/\bsf\b/i, "SF");
  if (loc && loc !== "unknown") return location.split(",")[0]?.trim().slice(0, 20) || "On-site";
  return "On-site";
}

export interface JobForSummary {
  title?: string;
  location?: string;
  description?: string;
  department?: string;
}

export function jobSummary(job: JobForSummary): string {
  const text = `${job.title ?? ""} ${job.description ?? ""} ${job.department ?? ""}`.slice(0, 2000);
  const tech = extractTech(text);
  const salary = extractSalary(text);
  const workType = inferWorkType(job.location ?? "");

  const parts: string[] = [];
  if (tech.length > 0) parts.push(tech.slice(0, 3).map((t) => t.charAt(0).toUpperCase() + t.slice(1)).join(", "));
  parts.push(workType);
  if (salary) parts.push(salary);

  return parts.join(" · ") || "See job details";
}
