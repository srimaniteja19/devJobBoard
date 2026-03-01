"use client";

import type { AppStatus } from "@/types";

const PROMPTS_BY_STAGE: Record<string, string[]> = {
  WISHLIST: [
    "Should I apply for this role?",
    "How well does my resume match?",
    "What's the salary range for this role?",
    "Write a cover letter for this job",
    "Who should I reach out to at {company}?",
  ],
  APPLIED: [
    "Help me write a follow-up email",
    "How long should I wait to follow up?",
    "What's a good LinkedIn message to a recruiter?",
    "Rewrite my resume summary for this JD",
    "What keywords am I missing?",
  ],
  SCREENING: [
    "Prep me for a recruiter phone screen",
    "How do I answer 'what's your salary expectation'?",
    "Give me 10 likely screener questions",
    "Write my 60-second pitch for this role",
    "What questions should I ask the recruiter?",
  ],
  INTERVIEW: [
    "Give me the top 10 interview questions",
    "Help me write a STAR story about [topic]",
    "What should I research about {company}?",
    "Grade my answer: [paste answer]",
    "What questions should I ask the interviewer?",
  ],
  OFFER: [
    "Help me negotiate this offer",
    "Is this salary fair for this role?",
    "Write a counter-offer email",
    "What benefits should I negotiate?",
    "How do I compare this to other offers?",
  ],
  REJECTED: [
    "Write a graceful rejection reply",
    "What likely went wrong?",
    "Help me improve for next time",
    "Write a re-engagement email",
    "Find similar roles I should apply to",
  ],
  GHOSTED: [
    "Write a re-engagement email",
    "What likely went wrong?",
    "Help me improve for next time",
    "Write a graceful follow-up",
    "Find similar roles I should apply to",
  ],
};

const DEFAULT_PROMPTS = PROMPTS_BY_STAGE.WISHLIST;

interface SuggestedPromptsProps {
  status: AppStatus | string;
  company: string;
  role: string;
  onSelect: (text: string) => void;
  visible: boolean;
}

export function SuggestedPrompts({ status, company, role, onSelect, visible }: SuggestedPromptsProps) {
  if (!visible) return null;

  const prompts = PROMPTS_BY_STAGE[status] ?? DEFAULT_PROMPTS;
  const resolved = prompts.map((p) =>
    p.replace(/\{company\}/g, company).replace(/\{role\}/g, role)
  );

  return (
    <div className="flex flex-wrap gap-3 p-1">
      {resolved.map((text) => (
        <button
          key={text}
          type="button"
          onClick={() => onSelect(text)}
          className="rounded-full border border-edge bg-surface px-3.5 py-2 text-[12px] font-light text-t-muted transition-colors hover:border-accent hover:text-accent"
        >
          {text}
        </button>
      ))}
    </div>
  );
}
