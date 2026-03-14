"use client";

import { useState, useEffect, useCallback } from "react";
import { BookmarkCheck, ChevronDown, ChevronUp, ExternalLink, Trash2, Check } from "lucide-react";

interface SavedJob {
  id: string;
  jobId: string;
  title: string;
  company: string;
  jobUrl: string;
  location?: string | null;
  source: string;
  appliedAt: string | null;
}

export default function SavedJobsList({ onRemove }: { onRemove?: () => void }) {
  const [saved, setSaved] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const fetchSaved = useCallback(async () => {
    try {
      const res = await fetch("/api/jobs/saved");
      const data = await res.json();
      if (res.ok && data.savedJobs) setSaved(data.savedJobs);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSaved();
  }, [fetchSaved]);

  const handleRemove = async (jobId: string) => {
    try {
      await fetch(`/api/jobs/saved?jobId=${encodeURIComponent(jobId)}`, { method: "DELETE" });
      setSaved((prev) => prev.filter((s) => s.jobId !== jobId));
      onRemove?.();
    } catch {
      // ignore
    }
  };

  if (saved.length === 0 && !loading) return null;

  return (
    <div className="rounded-2xl border border-jobs-edge/50 bg-jobs-card p-5 shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <BookmarkCheck className="h-4 w-4 text-jobs-accent" />
          <span className="text-[13px] font-semibold text-jobs-text">
            Saved jobs
          </span>
          {saved.length > 0 && (
            <span className="rounded-full bg-jobs-accent/20 px-2 py-0.5 text-[10px] font-medium text-jobs-accent">
              {saved.length}
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-jobs-muted" />
        ) : (
          <ChevronDown className="h-4 w-4 text-jobs-muted" />
        )}
      </button>

      {expanded && (
        <div className="mt-4 space-y-2 border-t border-jobs-edge/60 pt-4">
          {loading ? (
            <p className="text-[12px] text-jobs-faint">Loading…</p>
          ) : saved.length === 0 ? (
            <p className="text-[12px] text-jobs-faint">No saved jobs yet. Bookmark jobs from the list.</p>
          ) : (
            saved.map((job) => (
              <div
                key={job.id}
                className="flex items-start justify-between gap-2 rounded-lg border border-jobs-edge/60 p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-medium text-jobs-text">{job.title}</p>
                  <p className="text-[11px] text-jobs-muted">{job.company}</p>
                  {job.appliedAt && (
                    <span className="mt-1 inline-flex items-center gap-1 text-[10px] text-emerald-600">
                      <Check className="h-3 w-3" /> Applied
                    </span>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <a
                    href={job.jobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded p-1.5 text-jobs-muted hover:bg-jobs-accent/10 hover:text-jobs-accent"
                    aria-label="Apply"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleRemove(job.jobId)}
                    className="rounded p-1.5 text-jobs-muted hover:bg-red-500/10 hover:text-red-500"
                    aria-label="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
