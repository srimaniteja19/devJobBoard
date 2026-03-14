"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Link2, ChevronDown, ChevronUp } from "lucide-react";

interface UserJobSource {
  id: string;
  company: string;
  source: string;
  boardToken: string;
  careersUrl: string | null;
}

export default function AddCareersPage({ onAdd }: { onAdd?: () => void }) {
  const [sources, setSources] = useState<UserJobSource[]>([]);
  const [url, setUrl] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const fetchSources = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/jobs/sources");
      const data = await res.json();
      if (res.ok) setSources(data.sources ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setAdding(true);
    setError(null);
    try {
      const res = await fetch("/api/jobs/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), company: company.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to add");
        return;
      }
      setUrl("");
      setCompany("");
      setSuccessMessage(
        data.source?.source === "custom"
          ? "Saved. We try to scrape jobs from this page (not all sites support it)."
          : "Saved. Jobs will be fetched automatically."
      );
      setTimeout(() => setSuccessMessage(null), 4000);
      await fetchSources();
      onAdd?.();
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await fetch(`/api/jobs/sources/${id}`, { method: "DELETE" });
      await fetchSources();
      onAdd?.();
    } catch {
      // ignore
    }
  };

  return (
    <div className="rounded-2xl border border-jobs-edge/50 bg-jobs-card p-5 shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-jobs-accent" />
          <span className="text-[13px] font-semibold text-jobs-text">
            Your Careers Pages
          </span>
          {sources.length > 0 && (
            <span className="rounded-full bg-jobs-accent/20 px-2 py-0.5 text-[10px] font-medium text-jobs-accent">
              {sources.length}
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
        <div className="mt-4 space-y-4">
          <p className="text-[11px] text-jobs-faint">
            Greenhouse, Ashby, Lever: auto-fetched. Other URLs: saved; we try to scrape jobs when the page supports JSON-LD (not all sites).
          </p>
          <form onSubmit={handleAdd} className="space-y-3">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://... (any careers page URL)"
              className="w-full rounded-lg border border-jobs-edge bg-jobs-card px-3 py-2 text-[12px] text-jobs-text placeholder:text-jobs-faint outline-none focus:border-jobs-accent"
            />
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Company name (required for custom URLs)"
              className="w-full rounded-lg border border-jobs-edge bg-jobs-card px-3 py-2 text-[12px] text-jobs-text placeholder:text-jobs-faint outline-none focus:border-jobs-accent"
            />
            {error && (
              <p className="text-[11px] text-red-500">{error}</p>
            )}
            {successMessage && (
              <p className="text-[11px] text-emerald-600">{successMessage}</p>
            )}
            <button
              type="submit"
              disabled={adding || !url.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-jobs-accent py-2 text-[12px] font-medium text-white transition-colors hover:bg-jobs-accent-hover disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {adding ? "Adding…" : "Add Careers Page"}
            </button>
          </form>

          {sources.length > 0 && (
            <div className="space-y-2 border-t border-jobs-edge/60 pt-4">
              <p className="text-[11px] font-medium text-jobs-muted">
                Added ({sources.length})
              </p>
              {sources.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-lg border border-jobs-edge/60 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-medium text-jobs-text">
                      {s.company}
                    </p>
                    <p className="text-[10px] text-jobs-faint">
                      {s.source === "custom"
                        ? "Link saved; jobs scraped when possible"
                        : s.source}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(s.id)}
                    className="shrink-0 rounded p-1.5 text-jobs-faint hover:bg-red-500/10 hover:text-red-500"
                    aria-label="Remove"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
