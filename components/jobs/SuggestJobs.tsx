"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";
import type { SuggestedJob } from "@/types";

interface Props {
  applicationId: string;
  company: string;
}

type Status = "idle" | "loading" | "success" | "error";

export default function SuggestJobs({ applicationId, company }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [jobs, setJobs] = useState<SuggestedJob[]>([]);
  const [extractedContext, setExtractedContext] = useState<{ baseRole: string; coreSkills: string[] } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(false);

  const fetchSuggestions = useCallback(async () => {
    if (cooldown) return;
    setStatus("loading");
    setJobs([]);
    setExtractedContext(null);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/applications/${applicationId}/suggest`, { method: "POST" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrorMessage(typeof data.error === "string" ? data.error : `Request failed (${res.status})`);
        setStatus("error");
        return;
      }

      const hasError = data.error && (data.errorCode === "parse_failed" || data.errorCode === "no_results" || data.errorCode === "search_failed");
      if (hasError) {
        setErrorMessage(typeof data.error === "string" ? data.error : null);
        setStatus(data.jobs?.length ? "success" : "error");
        setJobs(data.jobs ?? []);
        setExtractedContext(data.extractedContext ?? null);
        return;
      }

      setJobs(data.jobs ?? []);
      setExtractedContext(data.extractedContext ?? null);
      setErrorMessage(null);
      setStatus("success");

      setCooldown(true);
      setTimeout(() => setCooldown(false), 10000);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Network error");
      setStatus("error");
    }
  }, [applicationId, cooldown]);

  const handleTrack = (job: SuggestedJob) => {
    const params = new URLSearchParams({ company: job.company, role: job.title });
    router.push(`/dashboard?add=1&${params.toString()}`);
  };

  return (
    <section className="mt-6 border border-edge bg-surface p-4 sm:p-6">
      <h2 className="mb-3 text-[11px] font-medium uppercase tracking-widest text-t-muted sm:mb-4">
        Similar Jobs
      </h2>

      {status === "idle" && (
        <button
          type="button"
          onClick={fetchSuggestions}
          className="border border-edge bg-transparent px-4 py-2 text-[13px] font-light text-t-muted transition-all duration-150 hover:border-accent hover:text-accent"
        >
          ✦ Suggest Similar Jobs
        </button>
      )}

      {status === "loading" && (
        <div>
          <p className="animate-pulse-opacity mb-4 text-[13px] font-light text-t-faint">
            Searching {company} careers...
          </p>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-shimmer h-16 rounded bg-[#111]" />
            ))}
          </div>
        </div>
      )}

      {status === "success" && jobs.length === 0 && (
        <p className="text-[13px] font-light text-t-faint">
          {errorMessage ?? `No similar roles at ${company} or other companies from careers sites, Hiring Cafe, LinkedIn, Greenhouse, or Ashby in the last 24 hours.`}
        </p>
      )}

      {status === "success" && jobs.length > 0 && (
        <div className="mt-4 rounded-md border border-edge bg-[#0d0d0d] p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-[13px] font-medium text-t-primary">
              Similar roles at {company} & other companies
            </h3>
            <div className="flex flex-wrap gap-1">
              {extractedContext?.coreSkills?.slice(0, 4).map((s) => (
                <span
                  key={s}
                  className="border border-[#222] bg-[#1a1a1a] px-2 py-0.5 text-[11px] font-light text-t-muted"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
          <p className="mb-4 text-[11px] font-light text-t-faint">
            Company careers + Hiring Cafe, LinkedIn, Greenhouse, Ashby · Similar roles at {company} and other companies · Last 24 hours · {jobs.length} found
          </p>

          <div className="space-y-0">
            {jobs.map((job, i) => (
              <div
                key={`${job.url}-${i}`}
                className={`border-b border-[#0f0f0f] py-3.5 last:border-0`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-t-primary">{job.title}</p>
                    <p className="mt-0.5 text-[11px] font-light text-t-faint">
                      {job.location} · {job.postedRecency}
                    </p>
                    <p className="mt-1 text-[12px] font-light italic text-t-muted">{job.matchReason}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleTrack(job)}
                      className="text-[11px] font-light text-t-faint transition-colors hover:text-t-primary"
                    >
                      ＋ Track this
                    </button>
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 border border-accent/30 bg-transparent px-2 py-1 text-[11px] font-medium text-accent transition-colors hover:bg-accent/10"
                    >
                      Apply → <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {!cooldown && (
            <button
              type="button"
              onClick={fetchSuggestions}
              className="mt-3 text-[11px] font-light text-accent transition-colors hover:text-accent-hover"
            >
              Refresh results
            </button>
          )}
        </div>
      )}

      {status === "error" && (
        <div>
          <p className="text-[13px] font-light text-t-faint">
            {errorMessage ?? "Couldn't find open roles. We suggest jobs from company careers sites, Hiring Cafe, LinkedIn, Greenhouse, and Ashby (last 24 hours)."}
          </p>
          <button
            type="button"
            onClick={fetchSuggestions}
            className="mt-1 text-[12px] font-light text-accent transition-colors hover:text-accent-hover"
          >
            Retry
          </button>
        </div>
      )}
    </section>
  );
}
