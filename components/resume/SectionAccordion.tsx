"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import ScoreRing, { getScoreColor } from "./ScoreRing";

interface BulletImprovement {
  original: string;
  improved: string;
  reason: string;
}

interface SectionSummary {
  score: number;
  feedback: string;
  rewrite: string;
}

interface SectionExperience {
  score: number;
  feedback: string;
  bulletImprovements?: BulletImprovement[];
}

interface SectionSkills {
  score: number;
  toAdd?: string[];
  toRemove?: string[];
  toReorder?: string;
}

interface SectionEducation {
  score: number;
  feedback: string;
}

interface SectionProjects {
  score: number;
  feedback: string;
  mostRelevant?: string[];
  toRemove?: string[];
}

interface SectionAnalysis {
  summary?: SectionSummary;
  experience?: SectionExperience;
  skills?: SectionSkills;
  education?: SectionEducation;
  projects?: SectionProjects;
}

interface SectionAccordionProps {
  sectionAnalysis: SectionAnalysis;
}

export default function SectionAccordion({
  sectionAnalysis,
}: SectionAccordionProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    summary: true,
  });
  const [copied, setCopied] = useState<string | null>(null);

  const toggle = (key: string) => {
    setExpanded((p) => ({ ...p, [key]: !p[key] }));
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const Bar = ({ score, label }: { score: number; label: string }) => {
    const color = getScoreColor(score);
    return (
      <div className="flex items-center gap-2">
        <span className="w-24 text-[11px] font-light text-[#555]">{label}</span>
        <div className="h-1.5 flex-1 overflow-hidden rounded bg-edge">
          <div
            className="h-full rounded transition-all duration-500"
            style={{ width: `${score}%`, backgroundColor: color }}
          />
        </div>
        <span className="w-8 text-right text-[11px] font-medium text-t-muted">
          {score}%
        </span>
      </div>
    );
  };

  const Section = ({
    keyName,
    title,
    children,
    score,
  }: {
    keyName: string;
    title: string;
    children: React.ReactNode;
    score?: number;
  }) => {
    const isExpanded = expanded[keyName] ?? false;
    return (
      <div className="overflow-hidden rounded-md border border-edge bg-surface">
        <button
          type="button"
          onClick={() => toggle(keyName)}
          className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
        >
          <div className="flex items-center gap-3">
            {score !== undefined && (
              <div className="h-6 w-8">
                <ScoreRing score={score} size={28} strokeWidth={3} />
              </div>
            )}
            <span className="text-[12px] font-medium text-t-primary">
              {title}
            </span>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-t-muted" />
          ) : (
            <ChevronDown className="h-4 w-4 text-t-muted" />
          )}
        </button>
        {isExpanded && <div className="border-t border-[#1e1e1e] p-4">{children}</div>}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {sectionAnalysis.summary && (
        <Section
          keyName="summary"
          title="Summary"
          score={sectionAnalysis.summary.score}
        >
          <div className="space-y-3">
            {sectionAnalysis.summary.rewrite && (
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-[#555] line-through">
                    Original
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        sectionAnalysis.summary!.rewrite,
                        "summary-rewrite"
                      )
                    }
                    className="flex items-center gap-1 border border-edge bg-surface px-2 py-1 text-[10px] text-accent"
                  >
                    {copied === "summary-rewrite" ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    Copy
                  </button>
                </div>
                <p className="mt-1 text-[13px] font-light leading-relaxed text-t-primary">
                  {sectionAnalysis.summary.rewrite}
                </p>
              </div>
            )}
            {sectionAnalysis.summary.feedback && (
              <p className="text-[12px] italic text-[#777]">
                {sectionAnalysis.summary.feedback}
              </p>
            )}
          </div>
        </Section>
      )}

      {sectionAnalysis.experience && (
        <Section
          keyName="experience"
          title="Experience"
          score={sectionAnalysis.experience.score}
        >
          <div className="space-y-4">
            {sectionAnalysis.experience.feedback && (
              <p className="text-[12px] text-t-muted">
                {sectionAnalysis.experience.feedback}
              </p>
            )}
            {sectionAnalysis.experience.bulletImprovements?.map((b, i) => (
              <div key={i} className="space-y-1">
                <div className="rounded border border-[#2a1a1a] bg-[#1a0a0a] p-2">
                  <p className="text-[12px] text-[#f87171] line-through">
                    {b.original}
                  </p>
                  <p className="mt-1 text-[12px] text-[#4ade80]">{b.improved}</p>
                </div>
                <p className="text-[11px] italic text-[#555]">{b.reason}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {sectionAnalysis.skills && (
        <Section
          keyName="skills"
          title="Skills"
          score={sectionAnalysis.skills.score}
        >
          <div className="space-y-3">
            {sectionAnalysis.skills.toAdd && sectionAnalysis.skills.toAdd.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[11px] text-[#4ade80]">+ Add:</span>
                {sectionAnalysis.skills.toAdd.map((s, i) => (
                  <span
                    key={i}
                    className="rounded border border-[#1a3a1a] bg-[#0a1a0a] px-2 py-0.5 text-[12px] text-[#4ade80]"
                  >
                    + {s}
                  </span>
                ))}
              </div>
            )}
            {sectionAnalysis.skills.toRemove && sectionAnalysis.skills.toRemove.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[11px] text-[#f87171]">× Remove:</span>
                {sectionAnalysis.skills.toRemove.map((s, i) => (
                  <span
                    key={i}
                    className="rounded border border-[#3a1a1a] bg-[#1a0a0a] px-2 py-0.5 text-[12px] text-[#f87171]"
                  >
                    × {s}
                  </span>
                ))}
              </div>
            )}
            {sectionAnalysis.skills.toReorder && (
              <p className="text-[12px] text-[#777]">
                {sectionAnalysis.skills.toReorder}
              </p>
            )}
          </div>
        </Section>
      )}

      {sectionAnalysis.education && (
        <Section
          keyName="education"
          title="Education"
          score={sectionAnalysis.education.score}
        >
          <p className="text-[12px] text-t-muted">
            {sectionAnalysis.education.feedback}
          </p>
        </Section>
      )}

      {sectionAnalysis.projects && (
        <Section
          keyName="projects"
          title="Projects"
          score={sectionAnalysis.projects.score}
        >
          <div className="space-y-3">
            {sectionAnalysis.projects.feedback && (
              <p className="text-[12px] text-t-muted">
                {sectionAnalysis.projects.feedback}
              </p>
            )}
            {sectionAnalysis.projects.mostRelevant &&
              sectionAnalysis.projects.mostRelevant.length > 0 && (
                <div className="rounded border border-[#e8ff4730] bg-[#e8ff4720] p-2">
                  <p className="text-[11px] font-medium text-[#e8ff47]">
                    Most relevant:
                  </p>
                  <ul className="mt-1 list-disc pl-4 text-[12px] text-t-primary">
                    {sectionAnalysis.projects.mostRelevant.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}
            {sectionAnalysis.projects.toRemove &&
              sectionAnalysis.projects.toRemove.length > 0 && (
                <div className="opacity-40">
                  <p className="text-[11px] text-[#f87171]">To remove:</p>
                  <ul className="mt-0.5 list-disc pl-4 text-[12px] line-through text-t-muted">
                    {sectionAnalysis.projects.toRemove.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}
          </div>
        </Section>
      )}
    </div>
  );
}
