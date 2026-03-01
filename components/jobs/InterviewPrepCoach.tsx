"use client";

import { useState, useCallback, useEffect } from "react";
import {
  GraduationCap,
  ChevronDown,
  ChevronUp,
  Loader2,
  RotateCw,
  Lightbulb,
  FileDown,
} from "lucide-react";
import { generatePrepPdf } from "@/lib/prep-to-pdf";
import {
  PREP_BUTTON_LABELS,
  PREP_SECTIONS_BY_STAGE,
  type PrepSectionConfig,
} from "@/lib/prep-config";
import { STATUS_LABELS } from "@/types";
import type { AppStatus } from "@/types";

const STAGE_ORDER: AppStatus[] = [
  "WISHLIST",
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
  "GHOSTED",
];

const PREP_TIPS: Partial<Record<AppStatus, string[]>> = {
  WISHLIST: [
    "Compare salary expectations with market before applying.",
    "Research the company's recent news and growth trajectory.",
    "Check if your skills match 70%+ of the JD requirements.",
  ],
  APPLIED: [
    "Tailor your resume with JD keywords for ATS.",
    "Send a follow-up after 5-7 days if no response.",
    "Prepare a short cover letter even if optional.",
  ],
  SCREENING: [
    "Prepare a 60-second pitch before the call.",
    "Have 3-5 questions ready for the recruiter.",
    "Avoid giving a number first on salary—deflect professionally.",
  ],
  INTERVIEW: [
    "Use STAR format for behavioral questions.",
    "Research the company and interviewers beforehand.",
    "Prepare 3-5 strong questions to ask at the end.",
  ],
  OFFER: [
    "Never accept on the spot—ask for time to review.",
    "Negotiate salary and benefits together.",
    "Get the offer in writing before resigning.",
  ],
  REJECTED: [
    "Ask for feedback if appropriate.",
    "Keep the door open with a gracious reply.",
    "Apply the learnings to your next application.",
  ],
  GHOSTED: [
    "Send one polite follow-up after 1-2 weeks.",
    "Don't take it personally—hiring can be slow.",
    "Keep applying while you wait.",
  ],
};

interface Props {
  applicationId: string;
  company: string;
  role: string;
  currentStatus: string;
  initialPreps?: Record<string, unknown>;
}

function renderSectionContent(
  sectionKey: string,
  content: unknown,
  company: string
): React.ReactNode {
  if (content == null) return null;

  const obj = typeof content === "object" && content !== null ? (content as Record<string, unknown>) : null;
  if (!obj) return <pre className="text-[12px] text-t-primary">{String(content)}</pre>;

  // Common array fields
  const renderList = (arr: unknown[], key?: string) =>
    Array.isArray(arr) && arr.length > 0 ? (
      <ul className="space-y-1.5 text-[13px] font-light text-t-primary">
        {arr.map((item, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-accent">•</span>
            <span>{typeof item === "object" ? JSON.stringify(item) : String(item)}</span>
          </li>
        ))}
      </ul>
    ) : null;

  const renderObject = (o: Record<string, unknown>, title?: string) => (
    <div className="space-y-1.5">
      {title && <div className="text-[11px] font-medium text-t-muted">{title}</div>}
      {Object.entries(o).map(([k, v]) => (
        <div key={k} className="text-[12px]">
          <span className="font-medium text-t-muted">{k}: </span>
          <span className="font-light text-t-primary">
            {typeof v === "object" ? JSON.stringify(v) : String(v)}
          </span>
        </div>
      ))}
    </div>
  );

  // Section-specific rendering
  if (sectionKey === "likelyQuestions" && Array.isArray(obj.likelyQuestions)) {
    return renderList(obj.likelyQuestions as string[]);
  }
  if (sectionKey === "companyResearch") {
    const items = obj.items ?? obj.companyResearch;
    return renderList(Array.isArray(items) ? items : []);
  }
  if (sectionKey === "talkingPoints") {
    const pts = obj.points ?? obj.talkingPoints;
    return renderList(Array.isArray(pts) ? pts : []);
  }
  if (sectionKey === "starStories" && Array.isArray(obj.stories)) {
    const stories = obj.stories as Array<Record<string, string>>;
    return (
      <div className="space-y-4">
        {stories.map((s, i) => (
          <div key={i} className="border border-edge bg-bg p-3 sm:p-4">
            <div className="mb-1 text-[11px] font-medium text-accent">
              Use for: {s.suggestedUse || "General behavioral"}
            </div>
            <dl className="space-y-1.5 text-[12px] sm:text-[13px]">
              <div><dt className="font-medium text-t-muted">Situation</dt><dd className="font-light text-t-primary">{s.situation}</dd></div>
              <div><dt className="font-medium text-t-muted">Task</dt><dd className="font-light text-t-primary">{s.task}</dd></div>
              <div><dt className="font-medium text-t-muted">Action</dt><dd className="font-light text-t-primary">{s.action}</dd></div>
              <div><dt className="font-medium text-t-muted">Result</dt><dd className="font-light text-t-primary">{s.result}</dd></div>
            </dl>
          </div>
        ))}
      </div>
    );
  }

  // Generic object/array render
  if (Array.isArray(obj)) return renderList(obj);
  return (
    <div className="space-y-3 text-[12px] sm:text-[13px]">
      {Object.entries(obj).map(([k, v]) => {
        if (v == null || k === "companyResearch" && sectionKey !== "likelyQuestions") return null;
        if (Array.isArray(v)) return <div key={k}><div className="font-medium text-t-muted mb-1">{k}</div>{renderList(v)}</div>;
        if (typeof v === "object") return <div key={k}>{renderObject(v as Record<string, unknown>, k)}</div>;
        return (
          <div key={k}>
            <span className="font-medium text-t-muted">{k}: </span>
            <span className="font-light text-t-primary">{String(v)}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function InterviewPrepCoach({
  applicationId,
  company,
  role,
  currentStatus,
  initialPreps = {},
}: Props) {
  const [selectedStage, setSelectedStage] = useState<AppStatus>(currentStatus as AppStatus);
  const [prepsByStage, setPrepsByStage] = useState<Record<string, Record<string, unknown>>>({
    [currentStatus]: initialPreps,
  });
  const [loadingSections, setLoadingSections] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [tipsExpanded, setTipsExpanded] = useState(true);

  const stages = STAGE_ORDER;
  const sections = PREP_SECTIONS_BY_STAGE[selectedStage] ?? [];
  const preps = prepsByStage[selectedStage] ?? {};
  const buttonLabel = PREP_BUTTON_LABELS[selectedStage as AppStatus] ?? "Prep";
  const tips = PREP_TIPS[selectedStage as AppStatus] ?? [];

  useEffect(() => {
    setSelectedStage((s) => (s === currentStatus ? s : (currentStatus as AppStatus)));
  }, [currentStatus]);

  const fetchPreps = useCallback(
    async (stage: string) => {
      try {
        const res = await fetch(`/api/applications/${applicationId}/prep?stage=${stage}`);
        const data = await res.json();
        if (res.ok && typeof data === "object") {
          setPrepsByStage((prev) => ({ ...prev, [stage]: data as Record<string, unknown> }));
        }
      } catch {
        // ignore
      }
    },
    [applicationId]
  );

  const generateSection = useCallback(
    async (stage: string, sectionKey: string) => {
      const key = `${stage}:${sectionKey}`;
      setLoadingSections((prev) => new Set(prev).add(key));
      setError(null);
      try {
        const res = await fetch(`/api/applications/${applicationId}/prep/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stage, section: sectionKey }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(typeof data.error === "string" ? data.error : "Failed to generate");
          return;
        }
        const content = data.content;
        setPrepsByStage((prev) => ({
          ...prev,
          [stage]: {
            ...(prev[stage] ?? {}),
            [sectionKey]: content,
          },
        }));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Network error");
      } finally {
        setLoadingSections((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    },
    [applicationId]
  );

  const handleGenerateSection = (section: PrepSectionConfig) => {
    generateSection(selectedStage, section.key);
  };

  const handleDownloadPdf = () => {
    const doc = generatePrepPdf(role, company, selectedStage, preps, tips);
    const filename = `Prep-${company.replace(/\s+/g, "-")}-${role.replace(/\s+/g, "-")}-${selectedStage}.pdf`;
    doc.save(filename);
  };

  const hasAnyPrep = Object.keys(preps).length > 0;

  return (
    <section id="prep-section" className="mt-6 border border-edge bg-surface p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[11px] font-medium uppercase tracking-widest text-t-muted sm:text-[12px]">
          AI Prep Coach
        </h2>
      </div>

      {/* Stage tabs */}
      <div className="mt-3 flex flex-wrap gap-1 border-b border-edge pb-2">
        {stages.map((stage) => (
          <button
            key={stage}
            type="button"
            onClick={() => {
              setSelectedStage(stage);
              if (!(prepsByStage[stage] && Object.keys(prepsByStage[stage]).length > 0)) {
                fetchPreps(stage);
              }
            }}
            className={`border px-2 py-1 text-[11px] font-medium transition-all ${
              selectedStage === stage
                ? "border-accent bg-accent/10 text-accent"
                : "border-edge bg-transparent text-t-muted hover:border-accent/50 hover:text-t-primary"
            }`}
          >
            {STATUS_LABELS[stage]}
            {stage === currentStatus && " ←"}
          </button>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[12px] font-medium text-t-muted">
          Prep for {STATUS_LABELS[selectedStage as AppStatus]} — {buttonLabel}
        </span>
        <div className="flex items-center gap-2">
          {hasAnyPrep && (
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1 border border-accent bg-transparent px-2 py-1 text-[10px] font-medium text-accent transition-all duration-150 hover:bg-accent/10"
            >
              <FileDown className="h-3 w-3" />
              Download PDF
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              sections.forEach((s) => {
                if (!preps[s.key]) generateSection(selectedStage, s.key);
              });
            }}
            disabled={loadingSections.size > 0 || sections.every((s) => preps[s.key])}
            className="inline-flex items-center gap-1 border border-accent bg-transparent px-2 py-1 text-[10px] font-medium text-accent transition-all duration-150 hover:bg-accent/10 disabled:opacity-50"
          >
            <GraduationCap className="h-3 w-3" />
            Generate More
          </button>
        </div>
      </div>

      {/* Tips */}
      {tips.length > 0 && (
        <div className="mt-4 border border-edge bg-bg p-3">
          <button
            type="button"
            onClick={() => setTipsExpanded(!tipsExpanded)}
            className="flex w-full items-center justify-between text-left text-[11px] font-medium uppercase tracking-widest text-t-muted"
          >
            <span className="flex items-center gap-2">
              <Lightbulb className="h-3.5 w-3.5" />
              Tips
            </span>
            {tipsExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          {tipsExpanded && (
            <ul className="mt-2 space-y-1 text-[12px] font-light text-t-primary">
              {tips.map((t, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-accent">•</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Sections */}
      <div className="mt-4 space-y-4">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center justify-between text-left text-[12px] font-medium text-t-muted hover:text-t-primary"
        >
          {expanded ? "Collapse" : "Expand"} prep
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {expanded && (
          <div className="space-y-4 border-t border-edge pt-4">
            {error && (
              <p className="text-[12px] font-light text-[#f87171]">{error}</p>
            )}
            {sections.map((section) => {
              const content = preps[section.key];
              const loading = loadingSections.has(`${selectedStage}:${section.key}`);
              const Icon = section.icon;

              return (
                <div key={section.key} className="border border-edge bg-bg p-3 sm:p-4">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <h3 className="text-[11px] font-medium uppercase tracking-widest text-t-muted flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5" />
                      {section.label}
                    </h3>
                    <button
                      type="button"
                      onClick={() => handleGenerateSection(section)}
                      disabled={loading}
                      className="inline-flex items-center gap-1 border border-accent bg-transparent px-2 py-1 text-[10px] font-medium text-accent transition-all duration-150 hover:bg-accent/10 disabled:opacity-50"
                      title={content ? "Regenerate" : "Generate"}
                    >
                      {loading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <RotateCw className="h-3 w-3" />
                      )}
                      {content ? "Regenerate" : "Generate"}
                    </button>
                  </div>
                  {loading && !content && (
                    <p className="text-[12px] font-light text-t-faint">Generating...</p>
                  )}
                  {content ? (
                    <div className="mt-2">
                      {renderSectionContent(section.key, content, company)}
                    </div>
                  ) : null}
                  {!content && !loading && (
                    <p className="text-[12px] font-light text-t-faint">{section.emptyState}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
