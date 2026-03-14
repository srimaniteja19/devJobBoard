"use client";

import { useState, useEffect } from "react";
import { Sparkles, BookOpen, ExternalLink, Loader2 } from "lucide-react";

const STORAGE_KEY = "dashboard-daily-inspiration";

function getDateKey() {
  return new Date().toISOString().slice(0, 10);
}

interface InspirationData {
  motivation: string;
  quickLearn: {
    title: string;
    description: string;
    type: string;
    resource: { label: string; url: string; duration?: string };
  };
}

export default function DailyInspiration() {
  const [data, setData] = useState<InspirationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const key = getDateKey();
    try {
      const cached = localStorage.getItem(`${STORAGE_KEY}-${key}`);
      if (cached) {
        const parsed = JSON.parse(cached) as InspirationData;
        if (parsed.motivation && parsed.quickLearn) {
          setData(parsed);
          setLoading(false);
          return;
        }
      }
    } catch {
      // ignore
    }

    fetch("/api/dashboard/daily-inspiration")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.motivation && d?.quickLearn) {
          setData(d);
          try {
            localStorage.setItem(`${STORAGE_KEY}-${key}`, JSON.stringify(d));
          } catch {
            // ignore
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border px-4 py-3" style={{ backgroundColor: "var(--dash-card-bg)", borderColor: "var(--dash-card-border)" }}>
        <Loader2 className="h-4 w-4 animate-spin" style={{ color: "var(--dash-column-text)" }} />
        <span className="text-[13px]" style={{ color: "var(--dash-column-text)" }}>Loading inspiration...</span>
      </div>
    );
  }

  if (!data) return null;

  const r = data.quickLearn?.resource;

  return (
    <div className="space-y-3">
      <div className="flex gap-3 rounded-xl border px-4 py-3" style={{ backgroundColor: "var(--dash-card-bg)", borderColor: "var(--dash-card-border)" }}>
        <Sparkles className="h-5 w-5 shrink-0" style={{ color: "var(--dash-stat-applied)" }} />
        <p className="text-[13px] italic" style={{ color: "var(--dash-card-company)" }}>
          &ldquo;{data.motivation}&rdquo;
        </p>
      </div>
      <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: "var(--dash-card-bg)", borderColor: "var(--dash-card-border)" }}>
        <div className="flex items-center gap-2 border-b px-4 py-2" style={{ borderColor: "var(--dash-card-border)" }}>
          <BookOpen className="h-4 w-4" style={{ color: "var(--dash-stat-interview)" }} />
          <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--dash-column-text)" }}>
            Learn in 5–10 min
          </span>
        </div>
        <div className="p-4">
          <p className="font-medium" style={{ color: "var(--dash-card-company)" }}>
            {data.quickLearn.title}
          </p>
          <p className="mt-1 text-[12px]" style={{ color: "var(--dash-column-text)" }}>
            {data.quickLearn.description}
          </p>
          {r?.url && (
            <a
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-medium transition-colors hover:opacity-90"
              style={{ backgroundColor: "var(--dash-stat-applied)", color: "var(--color-on-accent, white)" }}
            >
              {r.label}
              {r.duration && <span className="opacity-90">· {r.duration}</span>}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
