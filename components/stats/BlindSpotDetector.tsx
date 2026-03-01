"use client";

import { useState } from "react";
import { Eye, Loader2, RefreshCw, AlertTriangle } from "lucide-react";

interface BlindSpotInsight {
  type: string;
  title: string;
  detail: string;
}

interface BlindSpotResult {
  insights: BlindSpotInsight[];
  message?: string;
}

const TYPE_LABELS: Record<string, string> = {
  mismatch: "Mismatch",
  underselling: "Underselling",
  timing: "Timing",
  targeting: "Targeting",
  stack: "Stack",
  salary: "Salary",
  other: "Other",
};

export default function BlindSpotDetector() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BlindSpotResult | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/stats/blind-spot", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Analysis failed");
        return;
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="border border-edge bg-surface p-4 sm:p-6">
      <div className="mb-3 flex items-center justify-between gap-2 sm:mb-4">
        <h2 className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-widest text-t-muted sm:text-[12px]">
          <Eye className="h-3.5 w-3.5" />
          Blind Spot Detector
        </h2>
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={loading}
          className="press inline-flex items-center gap-2 border border-accent bg-transparent px-3 py-1.5 text-[11px] font-medium text-accent transition-all duration-150 hover:bg-accent/10 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Analyzing…
            </>
          ) : result ? (
            <>
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh analysis
            </>
          ) : (
            <>
              <Eye className="h-3.5 w-3.5" />
              Run analysis
            </>
          )}
        </button>
      </div>

      <p className="mb-4 text-[12px] font-light text-t-faint sm:text-[13px]">
        AI analyzes all your applications — companies, roles, stack, salary, timing — and surfaces patterns you might miss.
      </p>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded border border-[#4a2c2c] bg-[#2a1a1a] p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#f87171]" />
          <p className="text-[12px] font-light text-[#f87171]">{error}</p>
        </div>
      )}

      {result && !loading && (
        <div className="space-y-3 border-t border-edge pt-4">
          {result.insights.length === 0 ? (
            <p className="text-[12px] font-light text-t-muted">
              {result.message ?? "No clear patterns detected. Add more applications and try again."}
            </p>
          ) : (
            <div className="space-y-3">
              {result.insights.map((insight, i) => (
                <div
                  key={i}
                  className="border border-edge bg-bg p-3 sm:p-4"
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-accent">
                      {TYPE_LABELS[insight.type] ?? insight.type}
                    </span>
                    <span className="text-[13px] font-medium text-t-primary">
                      {insight.title}
                    </span>
                  </div>
                  <p className="text-[12px] font-light leading-relaxed text-t-muted sm:text-[13px]">
                    {insight.detail}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
