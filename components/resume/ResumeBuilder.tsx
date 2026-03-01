"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  RefreshCw,
  Download,
  Copy,
  FileCode,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import ResumePreview from "./ResumePreview";

const STEPS = [
  "Parsing your resume format...",
  "Analyzing job requirements...",
  "Rewriting experience bullets...",
  "Optimizing keywords...",
  "Rendering your resume...",
];

interface GeneratedResumeRecord {
  id: string;
  htmlContent: string;
  jsonContent: string;
  changesSummary: string;
  version: number;
  createdAt: string;
}

interface ResumeBuilderProps {
  applicationId: string;
  hasResume: boolean;
  hasNotes: boolean;
  resumeFileName?: string | null;
  resumeMatchScoreBefore?: number | null;
  resumeMatchScoreAfter?: number | null;
}

export default function ResumeBuilder({
  applicationId,
  hasResume,
  hasNotes,
  resumeFileName,
  resumeMatchScoreBefore,
  resumeMatchScoreAfter,
}: ResumeBuilderProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [versions, setVersions] = useState<GeneratedResumeRecord[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<GeneratedResumeRecord | null>(null);
  const [scale, setScale] = useState(1);
  const [showHighlights, setShowHighlights] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [changesSummary, setChangesSummary] = useState<Record<string, unknown> | null>(null);

  const fetchVersions = useCallback(async () => {
    const res = await fetch(`/api/applications/${applicationId}/generate-resume`);
    if (res.ok) {
      const data = await res.json();
      setVersions(data);
      if (data.length > 0) {
        setSelectedVersion((prev) => prev ?? data[0]);
        setChangesSummary((prev) => {
          if (prev) return prev;
          try {
            return JSON.parse(data[0].changesSummary ?? "{}");
          } catch {
            return null;
          }
        });
      }
    }
  }, [applicationId]);

  useEffect(() => {
    if (applicationId) fetchVersions();
  }, [applicationId, fetchVersions]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setStep(0);

    const stepInterval = setInterval(() => {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    }, 1200);

    try {
      const res = await fetch(`/api/applications/${applicationId}/generate-resume`, {
        method: "POST",
      });
      clearInterval(stepInterval);
      setStep(STEPS.length - 1);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Generation failed");
      }

      const data = await res.json();
      setChangesSummary(data.changesSummary ?? null);

      const newRecord: GeneratedResumeRecord = {
        id: `new-${Date.now()}`,
        htmlContent: data.html,
        jsonContent: JSON.stringify(data.tailoredResume ?? {}),
        changesSummary: JSON.stringify(data.changesSummary ?? {}),
        version: data.version ?? 1,
        createdAt: new Date().toISOString(),
      };

      setVersions((prev) => [newRecord, ...prev]);
      setSelectedVersion(newRecord);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    const rec = selectedVersion;
    if (!rec?.htmlContent) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(rec.htmlContent);
    w.document.close();
    w.focus();
    setTimeout(() => {
      w.print();
      w.close();
    }, 500);
  };

  const handleCopyHtml = () => {
    if (selectedVersion?.htmlContent) {
      navigator.clipboard.writeText(selectedVersion.htmlContent);
    }
  };

  const handleDownloadHtml = () => {
    if (!selectedVersion?.htmlContent) return;
    const blob = new Blob([selectedVersion.htmlContent], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `resume-${applicationId}-v${selectedVersion.version}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleOpenNewTab = () => {
    if (!selectedVersion?.htmlContent) return;
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(selectedVersion.htmlContent);
      w.document.close();
    }
  };

  const canGenerate = hasResume && hasNotes;

  return (
    <section className="mt-6 border border-edge bg-surface p-4 sm:p-6">
      <h2 className="mb-2 text-[11px] font-medium uppercase tracking-widest text-t-muted">
        AI Resume Builder
      </h2>

      {/* Status checks */}
      <div className="mb-4 space-y-1.5 rounded border border-edge bg-bg p-3">
        <p className="text-[12px]">
          {hasResume ? (
            <span className="text-[#4ade80]">✓ Resume uploaded</span>
          ) : (
            <span className="text-[#f87171]">✗ No resume uploaded</span>
          )}
        </p>
        <p className="text-[12px]">
          {hasNotes ? (
            <span className="text-[#4ade80]">✓ Job description available</span>
          ) : (
            <span className="text-[#f87171]">✗ No job description found</span>
          )}
        </p>
      </div>

      {!canGenerate ? (
        <button
          type="button"
          disabled
          className="w-full border border-edge bg-bg py-3 text-[13px] font-medium text-t-muted opacity-60"
        >
          {!hasResume && "Upload Resume to Enable"}
          {hasResume && !hasNotes && "Add JD to Enable"}
        </button>
      ) : (
        <>
          <p className="mb-2 text-[11px] font-light text-[#333]">
            Creates a new resume in your exact format, optimized for this JD
          </p>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 bg-[#e8ff47] py-3 text-[13px] font-medium text-[#0a0a0a] transition-colors hover:opacity-90 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {STEPS[step]}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate Tailored Resume
              </>
            )}
          </button>
        </>
      )}

      {error && (
        <p className="mt-2 text-[12px] text-[#f87171]">{error}</p>
      )}

      {!loading && versions.length > 0 && selectedVersion && (
        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_2fr]">
          {/* Left — Changes */}
          <div className="space-y-4">
            <h3 className="text-[12px] font-medium text-[#f0f0f0]">
              What Gemini changed
            </h3>
            {changesSummary && (
              <div className="space-y-3 text-[12px]">
                {Boolean(changesSummary.summaryRewritten) && (
                  <div className="rounded border border-edge bg-bg p-3">
                    <p className="font-medium text-t-muted">Summary rewritten</p>
                    <p className="mt-1 text-[11px] italic text-[#555] line-through">
                      {String(changesSummary.originalSummaryPreview ?? "")}
                    </p>
                    <p className="mt-1 text-[11px] text-t-primary">
                      {String(changesSummary.newSummaryPreview ?? "")}
                    </p>
                  </div>
                )}
                {Boolean(changesSummary.bulletsOptimized) && (
                  <p className="text-t-muted">Bullets optimized for this JD</p>
                )}
                {Boolean(changesSummary.skillsReordered) && (
                  <p className="text-t-muted">Skills reordered by JD priority</p>
                )}
                {resumeMatchScoreBefore != null && resumeMatchScoreAfter != null && (
                  <p className="text-t-muted">
                    Score before: {resumeMatchScoreBefore}% → after: {resumeMatchScoreAfter}%
                  </p>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className="flex items-center gap-2 border border-edge bg-transparent px-3 py-1.5 text-[12px] font-medium text-t-muted hover:border-accent hover:text-accent"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Regenerate
            </button>

            {versions.length > 1 && (
              <div className="flex flex-wrap gap-1">
                {versions.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      setSelectedVersion(v);
                      try {
                        setChangesSummary(JSON.parse(v.changesSummary ?? "{}"));
                      } catch {}
                    }}
                    className={`rounded border px-2 py-1 text-[11px] ${
                      selectedVersion.id === v.id
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-edge text-t-muted hover:text-t-primary"
                    }`}
                  >
                    V{v.version}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right — Preview */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="flex items-center gap-1.5 border border-edge bg-bg px-2 py-1.5 text-[11px] font-medium text-t-primary hover:bg-edge"
              >
                <Download className="h-3.5 w-3.5" />
                Download PDF
              </button>
              <button
                type="button"
                onClick={handleCopyHtml}
                className="flex items-center gap-1.5 border border-edge bg-bg px-2 py-1.5 text-[11px] font-medium text-t-primary hover:bg-edge"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy HTML
              </button>
              <button
                type="button"
                onClick={handleDownloadHtml}
                className="flex items-center gap-1.5 border border-edge bg-bg px-2 py-1.5 text-[11px] font-medium text-t-primary hover:bg-edge"
              >
                <FileCode className="h-3.5 w-3.5" />
                Download HTML
              </button>
              <button
                type="button"
                onClick={handleOpenNewTab}
                className="flex items-center gap-1.5 border border-edge bg-bg px-2 py-1.5 text-[11px] font-medium text-t-primary hover:bg-edge"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open in new tab
              </button>
              <div className="flex items-center gap-1">
                {[0.5, 0.75, 1].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setScale(s)}
                    className={`rounded border px-2 py-0.5 text-[10px] ${
                      scale === s ? "border-accent text-accent" : "border-edge text-t-muted"
                    }`}
                  >
                    {s * 100}%
                  </button>
                ))}
              </div>
              <label className="flex cursor-pointer items-center gap-1.5 text-[11px] text-t-muted">
                <input
                  type="checkbox"
                  checked={showHighlights}
                  onChange={(e) => setShowHighlights(e.target.checked)}
                  className="rounded border-edge accent-accent"
                />
                Show highlights
              </label>
            </div>

            <ResumePreview
              htmlContent={selectedVersion.htmlContent}
              showHighlights={showHighlights}
              scale={scale}
            />

            <p className="text-[11px] text-[#333]">
              🟡 Newly added/rewritten for this JD (only on screen; hidden when printing)
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
