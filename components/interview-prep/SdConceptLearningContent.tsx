import {
  BookOpen,
  ClipboardList,
  ExternalLink,
  FileCode2,
  GraduationCap,
  Layers,
  Target,
  Video,
  Check,
} from "lucide-react";
import type { SdConcept, SdResource } from "@/lib/study/system-design-curriculum";
import { SD_PRIMER_README } from "@/lib/study/system-design-curriculum";

export function resourceKindIcon(kind: SdResource["kind"]) {
  switch (kind) {
    case "video":
      return <Video className="h-3.5 w-3.5 shrink-0" />;
    case "exercise":
      return <FileCode2 className="h-3.5 w-3.5 shrink-0" />;
    case "book":
      return <BookOpen className="h-3.5 w-3.5 shrink-0" />;
    case "course":
      return <GraduationCap className="h-3.5 w-3.5 shrink-0" />;
    default:
      return <Layers className="h-3.5 w-3.5 shrink-0" />;
  }
}

type Props = {
  concept: SdConcept;
  /** e.g. "Do this today" or "Revisit practice" */
  practiceLead: string;
  /** Explainer under the practice title */
  practiceHint: string;
};

export function SdConceptLearningContent({ concept, practiceLead, practiceHint }: Props) {
  return (
    <>
      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={concept.primerTopic?.href ?? SD_PRIMER_README}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl border-2 border-indigo-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-indigo-800 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50/80"
        >
          <BookOpen className="h-4 w-4" />
          {concept.primerTopic?.label ?? "Open System Design Primer"}
          <ExternalLink className="h-3.5 w-3.5 opacity-70" />
        </a>
        {concept.primerSolution && (
          <a
            href={concept.primerSolution.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-prep-primary/20 bg-violet-50 px-4 py-2.5 text-[13px] font-medium text-violet-900 transition hover:bg-violet-100/80"
          >
            <FileCode2 className="h-4 w-4" />
            {concept.primerSolution.title}
            <ExternalLink className="h-3.5 w-3.5 opacity-70" />
          </a>
        )}
      </div>

      {concept.practiceExercise && (
        <div className="mt-5 rounded-2xl border-2 border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 to-white p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <ClipboardList className="h-4 w-4 text-emerald-700" />
            <h4 className="text-[12px] font-bold uppercase tracking-wider text-emerald-900">
              {practiceLead} · {concept.practiceExercise.title}
            </h4>
            <span className="rounded-full bg-emerald-600/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
              ~{concept.practiceExercise.minutes} min
            </span>
          </div>
          <p className="mb-3 text-[12px] leading-relaxed text-emerald-900/80">{practiceHint}</p>
          <ol className="list-decimal space-y-2.5 pl-4 text-[13px] leading-relaxed text-prep-text">
            {concept.practiceExercise.steps.map((s, i) => (
              <li key={i} className="pl-1 marker:font-semibold marker:text-emerald-700">
                {s}
              </li>
            ))}
          </ol>
        </div>
      )}

      {concept.selfCheck && concept.selfCheck.length > 0 && (
        <div className="mt-5 rounded-2xl border border-amber-200/90 bg-amber-50/50 p-4 sm:p-5">
          <h4 className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-amber-900">
            <GraduationCap className="h-3.5 w-3.5" />
            Self-check (retrieval practice)
          </h4>
          <p className="mb-3 text-[12px] text-amber-900/85">
            Answer out loud or write 2–4 sentences each — no peeking at notes. If you stall, re-open the Primer section
            only for that gap.
          </p>
          <ul className="space-y-2">
            {concept.selfCheck.map((q, i) => (
              <li key={i} className="flex gap-2 text-[13px] text-prep-text">
                <span className="font-mono text-[11px] font-bold text-amber-700">{i + 1}.</span>
                {q}
              </li>
            ))}
          </ul>
        </div>
      )}

      {concept.memorizationTip && (
        <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 text-[12px] leading-relaxed text-prep-text-secondary">
          <span className="font-semibold text-prep-text">Memory: </span>
          {concept.memorizationTip}
        </p>
      )}

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div className="rounded-2xl border border-prep-primary/10 bg-prep-bg/40 p-4">
          <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-prep-text-secondary">
            Learning objectives
          </h4>
          <ul className="space-y-2">
            {concept.learningObjectives.map((o, i) => (
              <li key={i} className="flex gap-2 text-[13px] text-prep-text">
                <Target className="mt-0.5 h-3.5 w-3.5 shrink-0 text-prep-accent" />
                {o}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-prep-primary/10 bg-prep-bg/40 p-4">
          <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-prep-text-secondary">Quest todos</h4>
          <ul className="space-y-2">
            {concept.suggestedTodos.map((t, i) => (
              <li key={i} className="flex gap-2 text-[13px] text-prep-text">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-5">
        <h4 className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-prep-text-secondary">
          <BookOpen className="h-3.5 w-3.5" />
          Resources
        </h4>
        <div className="flex flex-col gap-2">
          {concept.resources.map((r) => (
            <a
              key={r.url}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-start gap-2 rounded-xl border border-prep-primary/15 bg-white px-3 py-2.5 text-left text-[12px] font-medium text-prep-primary transition hover:bg-indigo-50"
            >
              <span className="mt-0.5 text-indigo-500">{resourceKindIcon(r.kind)}</span>
              <span className="min-w-0 flex-1">
                <span className="block">{r.title}</span>
                {r.note && (
                  <span className="mt-0.5 block text-[11px] font-normal text-prep-text-secondary">{r.note}</span>
                )}
              </span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-60" />
            </a>
          ))}
        </div>
      </div>
    </>
  );
}
