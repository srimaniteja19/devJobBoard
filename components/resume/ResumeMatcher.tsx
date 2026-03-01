"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, Loader2, RefreshCw, CheckSquare } from "lucide-react";
import ScoreRing, { getScoreColor } from "./ScoreRing";
import KeywordPills from "./KeywordPills";
import SectionAccordion from "./SectionAccordion";
import ApplyChangesChecklist from "./ApplyChangesChecklist";

export interface ResumeMatchResult {
  overallScore: number;
  atsScore: number;
  scoreBreakdown?: {
    skillsMatch: number;
    experienceMatch: number;
    educationMatch: number;
    keywordDensity: number;
    formatScore: number;
  };
  verdict?: string;
  verdictReason?: string;
  keywordAnalysis?: {
    present?: Array<{ keyword: string; frequency: number; importance: string }>;
    missing?: Array<{
      keyword: string;
      importance: string;
      whereToAdd: string;
      suggestedPhrase: string;
    }>;
    overused?: Array<{ keyword: string; count: number; suggestion: string }>;
  };
  sectionAnalysis?: Record<string, unknown>;
  criticalIssues?: Array<{ issue: string; impact: string; fix: string }>;
  quickWins?: Array<{
    action: string;
    effort: string;
    impact: string;
    timeToFix: string;
  }>;
  hiringManagerPerspective?: string;
  competitiveEdge?: string;
  estimatedInterviewChance?: number;
  estimatedChanceAfterFix?: number;
  tailoredSummary?: string;
}

const LOADING_STEPS = [
  "Reading your resume...",
  "Parsing job requirements...",
  "Running keyword analysis...",
  "Scoring section by section...",
  "Generating improvements...",
];

interface ResumeMatcherProps {
  applicationId: string;
  status: string;
  resumeFileUrl: string | null;
  resumeFileName: string | null;
  resumeUploadedAt: Date | null;
  resumeText: string | null;
  initialMatch: ResumeMatchResult | null;
}

export default function ResumeMatcher({
  applicationId,
  status,
  resumeFileUrl,
  resumeFileName,
  resumeUploadedAt,
  resumeText,
  initialMatch,
}: ResumeMatcherProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<ResumeMatchResult | null>(initialMatch);
  const [error, setError] = useState<string | null>(null);
  const [showChecklist, setShowChecklist] = useState(false);
  const [reanalyzeConfirm, setReanalyzeConfirm] = useState(false);
  const [uploading, setUploading] = useState(false);

  const hasResume = !!(resumeFileUrl && (resumeText || resumeFileName));
  const isWishlist = status === "WISHLIST";

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/applications/${applicationId}/resume`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Upload failed");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    setLoadingStep(0);

    const stepInterval = setInterval(() => {
      setLoadingStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1));
    }, 1600);

    try {
      const res = await fetch(`/api/applications/${applicationId}/resume-match`, {
        method: "POST",
      });
      clearInterval(stepInterval);
      setLoadingStep(LOADING_STEPS.length - 1);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Analysis failed");
      }
      const data = await res.json();
      setResult(data);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const handleReanalyze = () => {
    if (!reanalyzeConfirm) {
      setReanalyzeConfirm(true);
      return;
    }
    setReanalyzeConfirm(false);
    setResult(null);
    runAnalysis();
  };

  const sb = result?.scoreBreakdown;
  const breakDownScores = sb
    ? [
        [sb.skillsMatch ?? 0, "Skills Match"],
        [sb.experienceMatch ?? 0, "Experience"],
        [sb.keywordDensity ?? 0, "Keywords"],
        [sb.formatScore ?? 0, "ATS Friendly"],
        [sb.educationMatch ?? 0, "Education"],
      ]
    : [];

  if (!isWishlist) {
    if (result) {
      return (
        <section className="mt-6 border border-edge bg-surface p-4 sm:p-6">
          <h2 className="mb-2 text-[11px] font-medium uppercase tracking-widest text-t-muted">
            Resume Match
          </h2>
          <p className="text-[12px] font-light text-t-faint">
            Analysis locked after applying. Last score: {result.overallScore}%
          </p>
        </section>
      );
    }
    return null;
  }

  if (!hasResume) {
    return (
      <section className="mt-6 border border-dashed border-[#1e1e1e] bg-surface p-4 sm:p-6">
        <h2 className="mb-2 text-[11px] font-medium uppercase tracking-widest text-t-muted">
          Match My Resume
        </h2>
        <p className="mb-4 text-[12px] font-light text-[#555]">
          Upload a resume to check how well it matches this role
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          className="hidden"
          onChange={handleUpload}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 border border-dashed border-[#1e1e1e] bg-bg px-4 py-3 text-[13px] font-light text-t-muted transition-colors hover:border-[#e8ff47] hover:text-t-primary disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          Upload PDF, DOCX, or TXT
        </button>
        {error && (
          <p className="mt-2 text-[12px] text-[#f87171]">{error}</p>
        )}
      </section>
    );
  }

  if (!result && !loading) {
    return (
      <section className="mt-6 border border-edge bg-surface p-4 sm:p-6">
        <h2 className="mb-2 text-[11px] font-medium uppercase tracking-widest text-t-muted">
          Match My Resume
        </h2>
        <p className="mb-2 text-[12px] font-light text-t-muted">
          {resumeFileName ?? "Resume"} ·{" "}
          {resumeUploadedAt
            ? new Date(resumeUploadedAt).toLocaleDateString()
            : ""}
        </p>
        <button
          type="button"
          onClick={runAnalysis}
          disabled={!resumeText}
          className="flex items-center gap-2 border-2 border-[#e8ff47] bg-transparent px-4 py-3 text-[13px] font-medium text-[#e8ff47] transition-colors hover:bg-[#e8ff47]/10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Analyze Resume Match
        </button>
        {!resumeText && (
          <p className="mt-2 text-[11px] text-[#555]">
            Text extraction failed. Re-upload the resume.
          </p>
        )}
        <p className="mt-2 text-[11px] font-light text-[#333]">
          Powered by Gemini · Takes ~10 seconds
        </p>
        {error && (
          <p className="mt-2 text-[12px] text-[#f87171]">{error}</p>
        )}
      </section>
    );
  }

  if (loading) {
    return (
      <section className="mt-6 border border-edge bg-surface p-4 sm:p-6">
        <h2 className="mb-4 text-[11px] font-medium uppercase tracking-widest text-t-muted">
          Analyzing...
        </h2>
        <div className="space-y-2">
          {LOADING_STEPS.map((step, i) => (
            <p
              key={i}
              className={`text-[12px] font-light ${
                i <= loadingStep ? "text-[#f0f0f0]" : "text-[#333]"
              }`}
            >
              ✦ {step}
            </p>
          ))}
        </div>
      </section>
    );
  }

  if (!result) return null;

  const scoreColor = getScoreColor(result.overallScore ?? 0);
  const currentChance = result.estimatedInterviewChance ?? 0;
  const afterChance = result.estimatedChanceAfterFix ?? 0;

  return (
    <section className="mt-6 border border-edge bg-surface p-4 sm:p-6">
      <h2 className="mb-4 text-[11px] font-medium uppercase tracking-widest text-t-muted">
        Resume Match Results
      </h2>

      {/* Score header */}
      <div className="mb-6 flex flex-wrap items-start gap-6">
        <div className="flex flex-col items-center gap-2">
          <div className="relative">
            <ScoreRing score={result.overallScore ?? 0} size={100} strokeWidth={8} />
            <span
              className="absolute inset-0 flex items-center justify-center text-[40px] font-normal"
              style={{ fontFamily: "'Instrument Serif', serif", color: scoreColor }}
            >
              {result.overallScore ?? 0}
            </span>
          </div>
          <span className="text-[11px] font-medium text-t-muted">
            {result.verdict ?? "MATCH"}
          </span>
        </div>

        <div className="flex-1 space-y-1.5 min-w-[200px]">
          {breakDownScores.map(([score, label], i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-24 text-[11px] font-light text-[#555]">
                {label}
              </span>
              <div className="h-1.5 flex-1 overflow-hidden rounded bg-[#1e1e1e]">
                <div
                  className="h-full rounded transition-all"
                  style={{
                    width: `${score}%`,
                    backgroundColor: getScoreColor(score as number),
                  }}
                />
              </div>
              <span className="w-8 text-right text-[11px] text-t-muted">
                {score}%
              </span>
            </div>
          ))}

          <div className="mt-3 flex items-center gap-2 text-[12px] font-medium">
            <span style={{ color: getScoreColor(currentChance) }}>
              {currentChance}% interview chance
            </span>
            <span className="text-[#555]">→</span>
            <span style={{ color: getScoreColor(afterChance) }}>
              {afterChance}% after fix
            </span>
          </div>
        </div>
      </div>

      {/* Hiring manager view */}
      {result.hiringManagerPerspective && (
        <div className="mb-6 border-l-2 border-[#e8ff47] bg-[#0d0d0d] p-4">
          <p className="mb-1 text-[11px] font-medium uppercase tracking-widest text-[#333]">
            Hiring manager&apos;s first impression
          </p>
          <p className="text-[13px] italic leading-relaxed text-[#777]">
            {result.hiringManagerPerspective}
          </p>
        </div>
      )}

      {/* Critical issues */}
      {result.criticalIssues && result.criticalIssues.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-3 text-[12px] font-medium text-[#f87171]">
            Critical Issues
          </h3>
          <div className="space-y-2">
            {result.criticalIssues.map((c, i) => (
              <div
                key={i}
                className="rounded border border-[#2a1a1a] bg-[#110a0a] p-3"
              >
                <p className="text-[13px] font-light text-[#f0f0f0]">
                  {c.issue}
                </p>
                <p className="mt-1 text-[12px] italic text-[#777]">{c.fix}</p>
                <span
                  className={`mt-1 inline-block text-[10px] font-medium ${
                    c.impact === "high" ? "text-[#f87171]" : "text-[#fb923c]"
                  }`}
                >
                  {c.impact.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick wins */}
      {result.quickWins && result.quickWins.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-3 text-[12px] font-medium text-[#e8ff47]">
            Quick Wins
          </h3>
          <div className="space-y-2">
            {result.quickWins.map((q, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded border border-edge bg-bg p-3"
              >
                <div className="mt-0.5 h-4 w-4 shrink-0 rounded border border-edge" />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-light text-[#f0f0f0]">
                    {q.action}
                  </p>
                  <div className="mt-1 flex gap-2">
                    <span className="rounded bg-[#1a1a1a] px-1.5 py-0.5 text-[10px] text-[#555]">
                      {q.timeToFix}
                    </span>
                    <span className="rounded bg-[#e8ff4720] px-1.5 py-0.5 text-[10px] font-medium text-[#e8ff47]">
                      {q.impact.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Keyword analysis */}
      {result.keywordAnalysis && (
        <div className="mb-6">
          <h3 className="mb-3 text-[12px] font-medium text-t-muted">
            Keyword Analysis
          </h3>
          <KeywordPills
            present={result.keywordAnalysis.present}
            missing={result.keywordAnalysis.missing}
            overused={result.keywordAnalysis.overused}
          />
        </div>
      )}

      {/* Section accordion */}
      {result.sectionAnalysis && (
        <div className="mb-6">
          <h3 className="mb-3 text-[12px] font-medium text-t-muted">
            Section by Section
          </h3>
          <SectionAccordion
            sectionAnalysis={result.sectionAnalysis as Parameters<
              typeof SectionAccordion
            >[0]["sectionAnalysis"]}
          />
        </div>
      )}

      {/* Competitive edge */}
      {result.competitiveEdge && (
        <div className="mb-6 rounded border border-[#1a2a1a] bg-[#0a0f0a] p-4">
          <p className="mb-1 text-[11px] font-medium uppercase tracking-widest text-[#4ade80]">
            Your edge for this role
          </p>
          <p className="text-[13px] font-light leading-relaxed text-[#f0f0f0]">
            {result.competitiveEdge}
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 border-t border-edge pt-4">
        <button
          type="button"
          onClick={handleReanalyze}
          className="flex items-center gap-2 border border-edge bg-transparent px-3 py-1.5 text-[12px] font-medium text-t-muted transition-colors hover:border-accent hover:text-accent"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          {reanalyzeConfirm ? "Click again to confirm" : "Re-analyze"}
        </button>
        <button
          type="button"
          onClick={() => setShowChecklist(true)}
          className="flex items-center gap-2 border border-accent bg-transparent px-3 py-1.5 text-[12px] font-medium text-accent transition-colors hover:bg-accent/10"
        >
          <CheckSquare className="h-3.5 w-3.5" />
          Apply Changes Checklist
        </button>
      </div>

      {showChecklist && (
        <ApplyChangesChecklist
          result={result}
          applicationId={applicationId}
          onClose={() => setShowChecklist(false)}
          onStatusChange={() => router.refresh()}
        />
      )}
    </section>
  );
}
