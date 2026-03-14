"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, RefreshCw, Briefcase, Search, X, MapPin, Bookmark, BookmarkCheck, Check } from "lucide-react";
import AddCareersPage from "./AddCareersPage";
import BrowseJobBoards from "./BrowseJobBoards";
import SavedJobsList from "./SavedJobsList";
import QuickApplyNotes from "./QuickApplyNotes";
import WhichJobFirst from "./WhichJobFirst";
import { fireConfetti } from "@/lib/confetti";

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
  summary?: string;
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

const JOBS_CACHE_KEY = "devjobboard-jobs-cache";
const CACHE_MAX_AGE_MS = 30 * 60 * 1000;

function loadJobsFromCache(): { jobs: (MatchedJob & { publishedAt?: string })[]; keywords: string[] } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(JOBS_CACHE_KEY);
    if (!raw) return null;
    const { jobs, keywords, ts } = JSON.parse(raw);
    if (!Array.isArray(jobs) || Date.now() - (ts || 0) > CACHE_MAX_AGE_MS) return null;
    return { jobs, keywords: Array.isArray(keywords) ? keywords : [] };
  } catch {
    return null;
  }
}

function saveJobsToCache(jobs: (MatchedJob & { publishedAt?: string })[], keywords: string[]) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(JOBS_CACHE_KEY, JSON.stringify({ jobs, keywords, ts: Date.now() }));
  } catch {
    // ignore
  }
}

export default function MatchedJobsList() {
  const router = useRouter();
  const [jobs, setJobs] = useState<(MatchedJob & { publishedAt?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [datePosted, setDatePosted] = useState<DateFilterKey | "">("1w");
  const [workTypes, setWorkTypes] = useState<WorkType[]>(["remote", "hybrid", "onsite"]);
  const [usaOnly, setUsaOnly] = useState(true);
  const [experience, setExperience] = useState<ExperienceFilterKey>("1-5");
  const [searchQuery, setSearchQuery] = useState("");
  const [savedMap, setSavedMap] = useState<Record<string, { id: string; appliedAt: string | null }>>({});

  const fetchSavedJobs = useCallback(async () => {
    try {
      const res = await fetch("/api/jobs/saved");
      const data = await res.json();
      if (res.ok && data.savedJobs) {
        const map: Record<string, { id: string; appliedAt: string | null }> = {};
        for (const s of data.savedJobs) {
          map[s.jobId] = { id: s.id, appliedAt: s.appliedAt };
        }
        setSavedMap(map);
      }
    } catch {
      // ignore
    }
  }, []);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/jobs/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          limit: 2000,
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

      const jobList = data.jobs ?? [];
      const kw = data.keywordsUsed ?? [];
      setJobs(jobList);
      setKeywords(kw);
      saveJobsToCache(jobList, kw);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [datePosted, workTypes, usaOnly, experience]);

  useEffect(() => {
    fetchSavedJobs();
  }, [fetchSavedJobs]);

  const isInitialMount = useRef(true);
  const lastFilters = useRef<string>("");
  useEffect(() => {
    const filterKey = `${datePosted}|${workTypes.join(",")}|${usaOnly}|${experience}`;
    const cached = loadJobsFromCache();

    if (isInitialMount.current) {
      isInitialMount.current = false;
      lastFilters.current = filterKey;
      if (cached) {
        setJobs(cached.jobs);
        setKeywords(cached.keywords);
        setLoading(false);
        setError(null);
        return;
      }
    } else if (filterKey !== lastFilters.current) {
      lastFilters.current = filterKey;
    } else if (cached) {
      // Same filters and we have cache (e.g. navigated back) – restore, don't refetch
      setJobs(cached.jobs);
      setKeywords(cached.keywords);
      setLoading(false);
      return;
    }

    fetchJobs();
  }, [datePosted, workTypes, usaOnly, experience, fetchJobs]);

  const toggleSave = async (job: MatchedJob, applied?: boolean) => {
    const saved = savedMap[job.id];
    if (saved) {
      try {
        await fetch(`/api/jobs/saved?jobId=${encodeURIComponent(job.id)}`, { method: "DELETE" });
        setSavedMap((m) => {
          const next = { ...m };
          delete next[job.id];
          return next;
        });
      } catch {
        // ignore
      }
      return;
    }
    try {
      const res = await fetch("/api/jobs/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: job.id,
          jobUrl: job.url,
          title: job.title,
          company: job.company,
          location: job.location,
          source: job.source,
          applied: applied ?? false,
        }),
      });
      const data = await res.json();
      if (res.ok && data.savedJob) {
        setSavedMap((m) => ({
          ...m,
          [job.id]: { id: data.savedJob.id, appliedAt: data.savedJob.appliedAt },
        }));
        if (applied) {
          fireConfetti();
          createTrackedApplication(job);
        }
      }
    } catch {
      // ignore
    }
  };

  const createTrackedApplication = async (job: MatchedJob) => {
    try {
      await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: job.company,
          role: job.title,
          jobUrl: job.url || undefined,
          location: job.location || undefined,
          status: "APPLIED",
          appliedAt: new Date().toISOString(),
        }),
      });
    } catch {
      // ignore
    }
  };

  const markApplied = async (job: MatchedJob) => {
    const saved = savedMap[job.id];
    if (!saved) {
      await toggleSave(job, true);
      return;
    }
    if (saved.appliedAt) return;
    try {
      const res = await fetch("/api/jobs/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: job.id,
          jobUrl: job.url,
          title: job.title,
          company: job.company,
          location: job.location,
          source: job.source,
          applied: true,
        }),
      });
      const data = await res.json();
      if (res.ok && data.savedJob) {
        setSavedMap((m) => ({
          ...m,
          [job.id]: { id: data.savedJob.id, appliedAt: data.savedJob.appliedAt },
        }));
        fireConfetti();
        createTrackedApplication(job);
      }
    } catch {
      // ignore
    }
  };

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
        <div className="rounded-2xl border border-jobs-edge/50 bg-jobs-card p-5 shadow-sm">
          <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-wider text-jobs-text">
            Job Filters
          </h2>
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
        <AddCareersPage onAdd={fetchJobs} />
        <WhichJobFirst jobs={filteredJobs} />
        <QuickApplyNotes />
        <SavedJobsList onRemove={fetchSavedJobs} />
        <BrowseJobBoards
          searchQuery={searchQuery}
          workTypes={workTypes}
          experience={experience}
          usaOnly={usaOnly}
        />
      </aside>

      {/* Right: job listings */}
      <div>
        <p className="mb-5 text-[13px] text-jobs-muted">
          {searchQuery
            ? `${filteredJobs.length} of ${jobs.length} jobs`
            : `${jobs.length} matched jobs`}{" "}
          <span className="text-jobs-faint">· Greenhouse, Ashby, Lever</span>
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-5">
          {filteredJobs.map((job) => {
            const saved = savedMap[job.id];
            const isApplied = saved?.appliedAt;
            const sourceColors: Record<string, { bg: string; avatar: string; pill: string; applyBtn: string }> = {
              greenhouse: { bg: "bg-[#fce7f3]", avatar: "bg-pink-500 text-white", pill: "bg-pink-500 text-white", applyBtn: "bg-pink-500 hover:bg-pink-600" },
              ashby: { bg: "bg-[#ffedd5]", avatar: "bg-orange-500 text-white", pill: "bg-orange-500 text-white", applyBtn: "bg-orange-500 hover:bg-orange-600" },
              lever: { bg: "bg-[#ede9fe]", avatar: "bg-violet-600 text-white", pill: "bg-violet-600 text-white", applyBtn: "bg-violet-600 hover:bg-violet-700" },
              custom: { bg: "bg-[#d1fae5]", avatar: "bg-teal-600 text-white", pill: "bg-teal-600 text-white", applyBtn: "bg-teal-600 hover:bg-teal-700" },
            };
            const theme = sourceColors[job.source] ?? sourceColors.greenhouse;
            return (
              <div
                key={job.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-black/5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl dark:border-white/5"
              >
                {/* Full card body - pastel colored (~75% of card) */}
                <div className={`min-h-[200px] flex-1 px-5 pt-5 pb-4 ${theme.bg} dark:bg-opacity-80`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold shadow-sm ${theme.avatar}`}>
                      {job.company.charAt(0).toUpperCase()}
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleSave(job)}
                      className="rounded-lg p-2 text-jobs-muted transition-colors hover:bg-white/60 hover:text-jobs-accent"
                      aria-label={saved ? "Unsave job" : "Save job"}
                    >
                      {saved ? <BookmarkCheck className="h-5 w-5 fill-jobs-accent text-jobs-accent" /> : <Bookmark className="h-5 w-5" />}
                    </button>
                  </div>
                  <h3 className="mt-3 line-clamp-2 text-[15px] font-semibold leading-snug text-jobs-text sm:text-base">
                    {job.title}
                  </h3>
                  {job.summary && (
                    <p className="mt-1 text-[12px] text-jobs-muted line-clamp-1" title={job.summary}>
                      {job.summary}
                    </p>
                  )}
                  <p className="mt-1 font-medium text-jobs-muted text-[13px]">{job.company}</p>
                  <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-jobs-faint">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{job.location}</span>
                  </p>
                  {job.publishedAt && (
                    <p className="mt-0.5 text-[11px] text-jobs-faint">{formatPostedDate(job.publishedAt)}</p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${theme.pill}`}>
                      {job.source}
                    </span>
                    <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-slate-600 dark:text-slate-200">
                      {job.matchScore}%
                    </span>
                    {isApplied && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] font-semibold text-white">
                        <Check className="h-3 w-3" /> Applied
                      </span>
                    )}
                  </div>
                </div>
                {/* Footer - white with Apply button in source color */}
                <div className="flex items-center justify-between gap-2 border-t border-jobs-edge/60 bg-white px-5 py-3 dark:border-jobs-edge/40 dark:bg-jobs-card/80">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleTrack(job)}
                      className="text-[12px] font-medium text-jobs-muted hover:text-jobs-accent"
                    >
                      Track
                    </button>
                    {!isApplied && (
                      <button
                        type="button"
                        onClick={() => markApplied(job)}
                        className="text-[12px] font-medium text-emerald-600 hover:text-emerald-700"
                      >
                        Mark applied
                      </button>
                    )}
                  </div>
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-2 rounded-full py-2 pl-4 pr-3 text-[12px] font-semibold text-white shadow-sm transition-all hover:shadow ${theme.applyBtn}`}
                  >
                    Apply
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </span>
                  </a>
                </div>
              </div>
            );
          })}
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
