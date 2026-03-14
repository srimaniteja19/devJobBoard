"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, RefreshCw, Briefcase, Search, X, MapPin } from "lucide-react";
import AddCareersPage from "./AddCareersPage";

type DateFilterKey = "1h" | "2h" | "6h" | "24h" | "3d" | "1w";
type WorkType = "remote" | "hybrid" | "onsite";
type ExperienceFilterKey = "any" | "0-1" | "1-3" | "1-5" | "3-5" | "5+";

const DATE_OPTIONS: { value: DateFilterKey; label: string }[] = [
  { value: "1h", label: "Last hour" },
  { value: "2h", label: "Last 2 hours" },
  { value: "6h", label: "Last 6 hours" },
  { value: "24h", label: "Last 24 hours" },
  { value: "3d", label: "Last 3 days" },
  { value: "1w", label: "This week" },
];

const EXPERIENCE_OPTIONS: { value: ExperienceFilterKey; label: string }[] = [
  { value: "any", label: "Any" },
  { value: "0-1", label: "0–1 years (Entry)" },
  { value: "1-3", label: "1–3 years" },
  { value: "1-5", label: "1–5 years (Mid)" },
  { value: "3-5", label: "3–5 years" },
  { value: "5+", label: "5+ years (Senior)" },
];

interface MatchedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  source: "greenhouse" | "ashby" | "lever" | "custom";
  matchScore: number;
  matchReason: string;
}

function formatPostedDate(publishedAt: string): string {
  try {
    const d = new Date(publishedAt);
    return d.toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export default function MatchedJobsList() {
  const router = useRouter();
  const [jobs, setJobs] = useState<(MatchedJob & { publishedAt?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [datePosted, setDatePosted] = useState<DateFilterKey | "">("24h");
  const [workTypes, setWorkTypes] = useState<WorkType[]>(["remote", "hybrid", "onsite"]);
  const [usaOnly, setUsaOnly] = useState(true);
  const [experience, setExperience] = useState<ExperienceFilterKey>("1-5");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/jobs/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          limit: 50,
          usaOnly,
          workTypes,
          datePosted: datePosted || undefined,
          experience: experience === "any" ? undefined : experience,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to load jobs");
        setJobs([]);
        return;
      }

      setJobs(data.jobs ?? []);
      setKeywords(data.keywordsUsed ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [datePosted, workTypes, usaOnly, experience]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleTrack = (job: MatchedJob) => {
    const params = new URLSearchParams({ company: job.company, role: job.title });
    router.push(`/dashboard?add=1&${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="h-80 animate-pulse rounded-2xl bg-jobs-card" />
        <div className="grid gap-5 sm:grid-cols-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-jobs-card" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-jobs-card p-8 text-center shadow-sm">
        <p className="text-[14px] text-jobs-muted">{error}</p>
        <button
          type="button"
          onClick={fetchJobs}
          className="mt-4 rounded-lg bg-jobs-accent px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-jobs-accent-hover"
        >
          Retry
        </button>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="rounded-xl bg-jobs-card p-10 text-center shadow-sm">
        <Briefcase className="mx-auto mb-4 h-12 w-12 text-jobs-muted" />
        <p className="text-[14px] text-jobs-muted">
          No matched jobs yet. Add applications with your skills (stack) so we can match you to relevant roles from Greenhouse & Ashby.
        </p>
        <p className="mt-2 text-[12px] text-jobs-faint">
          Jobs are pulled from 50+ companies including Stripe, Notion, Figma, Linear, Retool, and more.
        </p>
        <button
          type="button"
          onClick={fetchJobs}
          className="mt-5 rounded-lg bg-jobs-accent px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-jobs-accent-hover"
        >
          Refresh
        </button>
      </div>
    );
  }

  const toggleWorkType = (wt: WorkType) => {
    setWorkTypes((prev) =>
      prev.includes(wt) ? prev.filter((x) => x !== wt) : [...prev, wt]
    );
  };

  const searchLower = searchQuery.trim().toLowerCase();
  const filteredJobs = searchLower
    ? jobs.filter(
        (job) =>
          job.title.toLowerCase().includes(searchLower) ||
          job.company.toLowerCase().includes(searchLower) ||
          job.location.toLowerCase().includes(searchLower)
      )
    : jobs;

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      {/* Left sidebar: filters */}
      <aside className="space-y-6">
        <AddCareersPage onAdd={fetchJobs} />
        <div className="rounded-2xl border border-jobs-edge/50 bg-jobs-card p-5 shadow-sm">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-jobs-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search job title, company..."
              className="w-full rounded-lg border border-jobs-edge bg-jobs-card py-2.5 pl-9 pr-9 text-[13px] text-jobs-text placeholder:text-jobs-faint outline-none transition-colors focus:border-jobs-accent"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-jobs-faint hover:bg-jobs-edge hover:text-jobs-muted"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-wider text-jobs-text">
            Job Filters
          </h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-jobs-muted">
                Posted
              </label>
              <select
                value={datePosted}
                onChange={(e) => setDatePosted((e.target.value || "") as DateFilterKey)}
                className="w-full rounded-lg border border-jobs-edge bg-jobs-card px-3 py-2.5 text-[13px] text-jobs-text outline-none transition-colors focus:border-jobs-accent"
              >
                {DATE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-jobs-muted">
                Experience
              </label>
              <select
                value={experience}
                onChange={(e) => setExperience(e.target.value as ExperienceFilterKey)}
                className="w-full rounded-lg border border-jobs-edge bg-jobs-card px-3 py-2.5 text-[13px] text-jobs-text outline-none transition-colors focus:border-jobs-accent"
              >
                {EXPERIENCE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-[12px] font-medium text-jobs-muted">
                Workplace Type
              </label>
              <div className="space-y-2">
                {(["remote", "hybrid", "onsite"] as WorkType[]).map((wt) => (
                  <label
                    key={wt}
                    className="flex cursor-pointer items-center gap-2 text-[13px] text-jobs-text"
                  >
                    <input
                      type="checkbox"
                      checked={workTypes.includes(wt)}
                      onChange={() => toggleWorkType(wt)}
                      className="h-4 w-4 rounded border-jobs-edge text-jobs-accent focus:ring-jobs-accent"
                    />
                    <span className="capitalize">{wt}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="flex cursor-pointer items-center gap-2 text-[13px] text-jobs-text">
                <input
                  type="checkbox"
                  checked={usaOnly}
                  onChange={(e) => setUsaOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-jobs-edge text-jobs-accent focus:ring-jobs-accent"
                />
                <span>USA only</span>
              </label>
            </div>
            <button
              type="button"
              onClick={fetchJobs}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-jobs-edge bg-jobs-card py-2 text-[12px] text-jobs-muted transition-colors hover:border-jobs-accent hover:text-jobs-accent"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
          </div>
        </div>
      </aside>

      {/* Right: job listings */}
      <div>
        <p className="mb-5 text-[13px] text-jobs-muted">
          {searchQuery
            ? `${filteredJobs.length} of ${jobs.length} jobs`
            : `${jobs.length} matched jobs`}{" "}
          <span className="text-jobs-faint">· Greenhouse & Ashby</span>
        </p>
        {filteredJobs.length === 0 ? (
          <div className="rounded-xl bg-jobs-card p-8 text-center">
            <p className="text-[13px] text-jobs-muted">
              No jobs match &quot;{searchQuery}&quot;
            </p>
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="mt-2 text-[12px] text-jobs-accent hover:text-jobs-accent-hover"
            >
              Clear search
            </button>
          </div>
        ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className={`group relative overflow-hidden rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl ${
                job.matchScore >= 75
                  ? "border-l-4 border-l-jobs-accent border-jobs-edge bg-jobs-card shadow-md"
                  : "border-jobs-edge bg-jobs-card shadow-sm hover:border-jobs-edge hover:shadow-lg"
              }`}
            >
              <div className="p-5">
                <div className="flex gap-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold ${
                      job.matchScore >= 75
                        ? "bg-jobs-accent/20 text-jobs-accent"
                        : "bg-jobs-edge/80 text-jobs-muted"
                    }`}
                  >
                    {job.company.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-jobs-text transition-colors group-hover:text-jobs-accent">
                      {job.title}
                    </h3>
                    <p className="mt-0.5 font-medium text-jobs-muted">{job.company}</p>
                    <div className="mt-2 flex items-center gap-1.5 text-[12px] text-jobs-faint">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{job.location}</span>
                      {job.publishedAt && (
                        <span className="shrink-0">· {formatPostedDate(job.publishedAt)}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-jobs-edge/60 pt-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex h-8 min-w-[3rem] items-center justify-center rounded-lg px-2.5 text-[11px] font-semibold ${
                        job.matchScore >= 75
                          ? "bg-jobs-accent text-white"
                          : job.matchScore >= 50
                            ? "bg-jobs-accent/15 text-jobs-accent"
                            : "bg-jobs-edge/70 text-jobs-muted"
                      }`}
                    >
                      {job.matchScore}%
                    </span>
                    <span className="rounded-full bg-jobs-edge/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-jobs-faint">
                      {job.source}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleTrack(job)}
                      className="rounded-lg border border-jobs-edge px-3 py-1.5 text-[11px] font-medium text-jobs-muted transition-all hover:border-jobs-accent hover:bg-jobs-accent/5 hover:text-jobs-accent"
                    >
                      Track
                    </button>
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-jobs-accent px-3 py-1.5 text-[11px] font-semibold text-white transition-all hover:bg-jobs-accent-hover"
                    >
                      Apply <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}
        {keywords.length > 0 && (
          <p className="mt-4 text-[11px] text-jobs-faint">
            Matching on: {keywords.slice(0, 12).join(", ")}
            {keywords.length > 12 && " …"}
          </p>
        )}
      </div>
    </div>
  );
}
