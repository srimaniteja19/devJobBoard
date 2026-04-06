"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Crown,
  Flame,
  Loader2,
  Sparkles,
  Star,
  Trophy,
  Zap,
  Check,
  Circle,
  Rocket,
  Bookmark,
  History,
  X,
} from "lucide-react";
import { toYMDLocal } from "@/lib/date-helpers";
import { fireConfetti } from "@/lib/confetti";
import { SD_BADGES, type SdBadge } from "@/lib/study/sd-gamification";
import { SD_PRIMER_ANKI_FOLDER, SD_PRIMER_README, type SdConcept } from "@/lib/study/system-design-curriculum";
import { SdConceptLearningContent } from "@/components/interview-prep/SdConceptLearningContent";

type SdState = {
  version: number;
  curriculum: SdConcept[];
  startYmd: string | null;
  todayYmd: string;
  scheduledConceptId: string;
  completedIds: string[];
  revisitBookmarkIds: string[];
  revisitLastYmd: Record<string, string>;
  /** Omitted on older servers; treat undefined as ready. */
  revisitStorageReady?: boolean;
  xp: number;
  currentStreak: number;
  longestStreak: number;
  rank: { id: string; title: string; minXp: number };
  rankProgress: {
    current: { id: string; title: string; minXp: number };
    next: { id: string; title: string; minXp: number } | null;
    pct: number;
  };
  badgesUnlocked: string[];
  todayConcept: SdConcept;
  todayConceptCompleted: boolean;
  scheduledBonusAvailable: boolean;
};

const BADGE_ICONS: Record<SdBadge["icon"], React.ReactNode> = {
  zap: <Zap className="h-4 w-4" />,
  flame: <Flame className="h-4 w-4" />,
  trophy: <Trophy className="h-4 w-4" />,
  star: <Star className="h-4 w-4" />,
  target: <Star className="h-4 w-4" />,
  crown: <Crown className="h-4 w-4" />,
};

function BadgeTile({ badge, unlocked }: { badge: SdBadge; unlocked: boolean }) {
  return (
    <div
      title={`${badge.title}: ${badge.description}`}
      className={`flex flex-col items-center gap-1 rounded-xl border p-2.5 text-center transition-all ${
        unlocked
          ? "border-prep-accent/40 bg-gradient-to-b from-emerald-50 to-white shadow-sm shadow-emerald-200/50"
          : "border-prep-primary/10 bg-slate-50/80 opacity-60 grayscale"
      }`}
    >
      <span className={unlocked ? "text-prep-accent" : "text-slate-400"}>{BADGE_ICONS[badge.icon]}</span>
      <span className="max-w-[72px] text-[9px] font-semibold uppercase leading-tight text-prep-text">
        {badge.title}
      </span>
    </div>
  );
}

export default function SystemDesignMastery() {
  const [state, setState] = useState<SdState | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [curriculumOpen, setCurriculumOpen] = useState(false);
  const [pastLearningsOpen, setPastLearningsOpen] = useState(false);
  const [newBadges, setNewBadges] = useState<SdBadge[]>([]);
  const [revisitModalConceptId, setRevisitModalConceptId] = useState<string | null>(null);

  const ymd = toYMDLocal(new Date());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/study/system-design?ymd=${encodeURIComponent(ymd)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setState(data as SdState);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [ymd]);

  useEffect(() => {
    void load();
  }, [load]);

  const revisitModalConcept = useMemo(() => {
    if (!state || !revisitModalConceptId) return null;
    return state.curriculum.find((c) => c.id === revisitModalConceptId) ?? null;
  }, [state, revisitModalConceptId]);

  const startJourney = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/study/system-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", startYmd: ymd }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      if (data.state) setState(data.state as SdState);
      setToast("Quest log started — Day 1 unlocked!");
      setTimeout(() => setToast(null), 4000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setActionLoading(false);
    }
  };

  const completeConcept = async (conceptId: string) => {
    setActionLoading(true);
    setNewBadges([]);
    try {
      const res = await fetch("/api/study/system-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete", conceptId, ymd }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      if (data.state) setState(data.state as SdState);
      if (data.xpGained > 0) {
        fireConfetti();
        setToast(
          data.bonusScheduled
            ? `+${data.xpGained} XP (includes day bonus!)`
            : `+${data.xpGained} XP`
        );
      } else if (data.alreadyCompleted) {
        setToast("Already mastered — keep going!");
      }
      if (Array.isArray(data.newBadges) && data.newBadges.length > 0) {
        setNewBadges(data.newBadges as SdBadge[]);
      }
      setTimeout(() => setToast(null), 5000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setActionLoading(false);
    }
  };

  const toggleRevisitBookmark = async (conceptId: string, bookmarked: boolean) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/study/system-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: bookmarked ? "revisitUnbookmark" : "revisitBookmark",
          conceptId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Failed");
      if (data.state) setState(data.state as SdState);
      setToast(bookmarked ? "Removed from revisit queue" : "Saved to revisit queue");
      setTimeout(() => setToast(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setActionLoading(false);
    }
  };

  const logRevisit = async (conceptId: string) => {
    setActionLoading(true);
    setNewBadges([]);
    try {
      const res = await fetch("/api/study/system-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revisitLog", conceptId, ymd }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Failed");
      if (data.state) setState(data.state as SdState);
      if (data.xpGained > 0) {
        fireConfetti();
        setToast(`+${data.xpGained} XP — revisit logged`);
      } else if (data.alreadyLoggedToday) {
        setToast("Already logged a revisit for this topic today");
      }
      if (Array.isArray(data.newBadges) && data.newBadges.length > 0) {
        setNewBadges(data.newBadges as SdBadge[]);
      }
      setTimeout(() => setToast(null), 4000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-3xl border border-prep-primary/10 bg-white py-16">
        <Loader2 className="h-8 w-8 animate-spin text-prep-primary" />
      </div>
    );
  }

  if (error || !state) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50/80 px-6 py-8 text-center text-red-700">
        {error ?? "Could not load system design track"}
        <button
          type="button"
          onClick={() => void load()}
          className="mt-3 block w-full text-sm font-medium underline"
        >
          Retry
        </button>
      </div>
    );
  }

  const unlocked = new Set(state.badgesUnlocked);
  const completed = new Set(state.completedIds);
  const bookmarked = new Set(state.revisitBookmarkIds ?? []);
  const revisitOk = state.revisitStorageReady !== false;
  const progressPct = Math.round((state.completedIds.length / state.curriculum.length) * 100);
  const completedTopics = state.curriculum.filter((c) => completed.has(c.id));
  const bookmarkedTopics = state.revisitBookmarkIds
    .map((id) => state.curriculum.find((c) => c.id === id))
    .filter((c): c is SdConcept => !!c);

  return (
    <section className="overflow-hidden rounded-3xl border border-prep-primary/15 bg-gradient-to-br from-indigo-50/90 via-white to-emerald-50/60 shadow-xl shadow-indigo-200/20">
      <div className="border-b border-prep-primary/10 bg-white/60 px-5 py-4 backdrop-blur-sm sm:px-8 sm:py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-300/50">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-prep-text sm:text-xl">
                System design mastery
              </h2>
              <p className="mt-0.5 text-[13px] text-prep-text-secondary">
                One concept per day · XP, streaks, and badges — not tied to any job.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl border border-amber-200/80 bg-amber-50 px-3 py-2 text-center">
              <div className="flex items-center justify-center gap-1 text-amber-700">
                <Flame className="h-4 w-4" />
                <span className="text-lg font-bold tabular-nums">{state.currentStreak}</span>
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-amber-800/80">
                Day streak
              </div>
              <div className="text-[10px] text-amber-700/80">Best · {state.longestStreak}</div>
            </div>
            <div className="rounded-xl border border-indigo-200/80 bg-indigo-50 px-3 py-2 text-center">
              <div className="text-lg font-bold tabular-nums text-indigo-700">{state.xp}</div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-indigo-800/80">XP</div>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-1 flex justify-between text-[11px] font-medium text-prep-text-secondary">
            <span>{state.rank.title}</span>
            {state.rankProgress.next ? (
              <span>
                Next: {state.rankProgress.next.title} ({state.rankProgress.next.minXp} XP)
              </span>
            ) : (
              <span>Max rank</span>
            )}
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-200/80">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-500"
              initial={{ width: 0 }}
              animate={{ width: `${state.rankProgress.next ? state.rankProgress.pct : 100}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
            />
          </div>
          <p className="mt-1 text-[11px] text-prep-text-secondary">
            Track progress · {state.completedIds.length}/{state.curriculum.length} concepts ({progressPct}%)
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-indigo-100 bg-indigo-50/40 px-3 py-2.5 text-[12px] text-prep-text-secondary">
          <span className="font-semibold text-prep-text">Core material:</span>
          <a
            href={SD_PRIMER_README}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-indigo-700 underline decoration-indigo-300 underline-offset-2 hover:text-indigo-900"
          >
            System Design Primer (GitHub)
          </a>
          <span className="text-slate-300">·</span>
          <a
            href={SD_PRIMER_ANKI_FOLDER}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-indigo-700 underline decoration-indigo-300 underline-offset-2 hover:text-indigo-900"
          >
            Anki flashcard decks
          </a>
          <span className="text-slate-300">·</span>
          <a
            href="https://github.com/donnemartin/interactive-coding-challenges"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-indigo-700 underline decoration-indigo-300 underline-offset-2 hover:text-indigo-900"
          >
            Interactive coding challenges
          </a>
        </div>
      </div>

      <div className="px-5 py-5 sm:px-8 sm:py-6">
        <h3 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-prep-text-secondary">
          Badges
        </h3>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
          {SD_BADGES.map((b) => (
            <BadgeTile key={b.id} badge={b} unlocked={unlocked.has(b.id)} />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mx-5 mb-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-center text-[13px] font-medium text-emerald-900 sm:mx-8"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {newBadges.length > 0 && (
        <div className="mx-5 mb-4 rounded-2xl border border-violet-200 bg-violet-50/90 px-4 py-3 sm:mx-8">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-violet-800">New badge unlocked</p>
          <div className="flex flex-wrap gap-2">
            {newBadges.map((b) => (
              <span
                key={b.id}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-[12px] font-semibold text-violet-900 shadow-sm"
              >
                {BADGE_ICONS[b.icon]} {b.title}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-prep-primary/10 bg-white/80 px-5 py-6 sm:px-8">
        {!state.startYmd ? (
          <div className="text-center">
            <Rocket className="mx-auto h-10 w-10 text-prep-primary" />
            <h3 className="mt-3 text-lg font-semibold text-prep-text">Start your journey</h3>
            <p className="mx-auto mt-2 max-w-md text-[14px] text-prep-text-secondary">
              Commit to one system design concept per calendar day. Earn XP, keep your streak, and unlock badges as
              you master the full track.
            </p>
            <button
              type="button"
              onClick={() => void startJourney()}
              disabled={actionLoading}
              className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-[14px] font-semibold text-white shadow-lg shadow-indigo-300/40 transition hover:from-indigo-500 hover:to-violet-500 disabled:opacity-60"
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Begin mastery track
            </button>
          </div>
        ) : (
          <>
            {!revisitOk && (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50/90 px-3 py-2.5 text-[12px] text-amber-950">
                <strong className="font-semibold">Revisit bookmarks</strong> need two new columns on{" "}
                <code className="rounded bg-amber-100/80 px-1 font-mono text-[11px]">User</code>. From the project
                root run{" "}
                <code className="rounded bg-amber-100/80 px-1 font-mono text-[11px]">npx prisma db push</code> (local)
                or apply migrations in production, then reload.
              </div>
            )}
            {revisitOk && bookmarkedTopics.length > 0 && (
              <div className="mb-6 rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/90 to-orange-50/40 p-4 sm:p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Bookmark className="h-4 w-4 text-amber-700" />
                  <h3 className="text-[12px] font-bold uppercase tracking-wider text-amber-900">Revisit queue</h3>
                </div>
                <p className="mb-3 text-[12px] text-amber-900/85">
                  Topics you bookmarked — open one to run the practice steps again and log a revisit (+5 XP once per
                  topic per day).
                </p>
                <div className="flex flex-wrap gap-2">
                  {bookmarkedTopics.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setRevisitModalConceptId(c.id)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300/60 bg-white px-3 py-2 text-left text-[12px] font-medium text-amber-950 shadow-sm transition hover:bg-amber-50"
                    >
                      {c.title}
                      {state.revisitLastYmd?.[c.id] && (
                        <span className="text-[10px] font-normal text-amber-800/70">
                          · last {state.revisitLastYmd[c.id]}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-6">
              <button
                type="button"
                onClick={() => setPastLearningsOpen((o) => !o)}
                className="flex w-full items-center justify-between rounded-xl border border-prep-primary/15 bg-prep-bg/50 px-4 py-3 text-left transition hover:bg-prep-bg"
              >
                <span className="flex items-center gap-2 text-[13px] font-semibold text-prep-text">
                  <History className="h-4 w-4 text-prep-primary" />
                  Past learnings ({completedTopics.length})
                </span>
                <ChevronDown className={`h-5 w-5 text-prep-text-secondary transition-transform ${pastLearningsOpen ? "rotate-180" : ""}`} />
              </button>
              {pastLearningsOpen && (
                <ul className="mt-2 max-h-64 space-y-1.5 overflow-y-auto rounded-xl border border-prep-primary/10 bg-white p-2">
                  {completedTopics.length === 0 ? (
                    <li className="px-3 py-4 text-center text-[13px] text-prep-text-secondary">
                      Complete topics to see them here for review.
                    </li>
                  ) : (
                    completedTopics.map((c) => (
                      <li
                        key={c.id}
                        className="flex flex-wrap items-center gap-2 rounded-lg border border-transparent px-2 py-2 hover:border-prep-primary/10 hover:bg-slate-50/80"
                      >
                        <span className="min-w-0 flex-1 text-[13px] font-medium text-prep-text">{c.title}</span>
                        {state.revisitLastYmd?.[c.id] && (
                          <span className="text-[10px] text-prep-text-secondary">Revisited {state.revisitLastYmd[c.id]}</span>
                        )}
                        <button
                          type="button"
                          onClick={() => setRevisitModalConceptId(c.id)}
                          className="shrink-0 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-800"
                        >
                          Review
                        </button>
                        {revisitOk && (
                          <button
                            type="button"
                            title={bookmarked.has(c.id) ? "Remove from revisit queue" : "Add to revisit queue"}
                            onClick={() => void toggleRevisitBookmark(c.id, bookmarked.has(c.id))}
                            disabled={actionLoading}
                            className={`shrink-0 rounded-lg p-1.5 transition ${
                              bookmarked.has(c.id)
                                ? "bg-amber-100 text-amber-800"
                                : "text-slate-400 hover:bg-slate-100 hover:text-amber-700"
                            }`}
                          >
                            <Bookmark className={`h-4 w-4 ${bookmarked.has(c.id) ? "fill-current" : ""}`} />
                          </button>
                        )}
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>

            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-800">
                Today&apos;s quest
              </span>
              {state.scheduledBonusAvailable && !state.todayConceptCompleted && (
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800">
                  +50 XP day bonus if you finish this topic today
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold text-prep-text">{state.todayConcept.title}</h3>
            <p className="mt-2 text-[14px] leading-relaxed text-prep-text-secondary">{state.todayConcept.summary}</p>

            <SdConceptLearningContent
              concept={state.todayConcept}
              practiceLead="Do this today"
              practiceHint="Follow the steps in order — they mirror how engineers actually learn from the Primer (read → sketch → compare). Don&apos;t tap &quot;Complete&quot; until you&apos;ve done the work."
            />

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void completeConcept(state.todayConcept.id)}
                disabled={actionLoading || state.todayConceptCompleted}
                className="inline-flex flex-1 min-w-[200px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-3.5 text-[15px] font-bold text-white shadow-lg shadow-emerald-300/30 transition hover:from-emerald-400 hover:to-teal-500 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
              >
                {actionLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : state.todayConceptCompleted ? (
                  <>
                    <Check className="h-5 w-5" />
                    Mastered today
                  </>
                ) : (
                  <>
                    <Trophy className="h-5 w-5" />
                    Complete &amp; earn XP
                  </>
                )}
              </button>
              {state.todayConceptCompleted && revisitOk && (
                <button
                  type="button"
                  onClick={() => void toggleRevisitBookmark(state.todayConcept.id, bookmarked.has(state.todayConcept.id))}
                  disabled={actionLoading}
                  className={`inline-flex items-center gap-2 rounded-2xl border-2 px-4 py-3 text-[13px] font-semibold transition ${
                    bookmarked.has(state.todayConcept.id)
                      ? "border-amber-300 bg-amber-50 text-amber-900"
                      : "border-prep-primary/20 text-prep-text hover:border-amber-200"
                  }`}
                >
                  <Bookmark className={`h-4 w-4 ${bookmarked.has(state.todayConcept.id) ? "fill-current" : ""}`} />
                  {bookmarked.has(state.todayConcept.id) ? "In revisit queue" : "Save for revisit"}
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <div className="border-t border-prep-primary/10 bg-slate-50/50 px-5 py-4 sm:px-8">
        <button
          type="button"
          onClick={() => setCurriculumOpen((o) => !o)}
          className="flex w-full items-center justify-between text-left text-[13px] font-semibold text-prep-text"
        >
          <span>Full curriculum ({state.curriculum.length} concepts)</span>
          <ChevronDown className={`h-5 w-5 transition-transform ${curriculumOpen ? "rotate-180" : ""}`} />
        </button>
        {curriculumOpen && (
          <ul className="mt-3 max-h-72 space-y-1.5 overflow-y-auto pr-1">
            {state.curriculum.map((c, i) => {
              const done = completed.has(c.id);
              const isToday = c.id === state.scheduledConceptId;
              const bm = bookmarked.has(c.id);
              return (
                <li
                  key={c.id}
                  className={`flex items-center gap-2 rounded-lg border px-2 py-2 text-[12px] ${
                    isToday ? "border-indigo-300 bg-indigo-50/80" : "border-prep-primary/10 bg-white"
                  }`}
                >
                  <span className="w-6 shrink-0 text-center font-mono text-[10px] text-prep-text-secondary">
                    {i + 1}
                  </span>
                  {done ? (
                    <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <Circle className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                  )}
                  <span className={`min-w-0 flex-1 ${done ? "text-prep-text-secondary line-through" : "text-prep-text"}`}>
                    {c.title}
                  </span>
                  {done && (
                    <>
                      <button
                        type="button"
                        title="Review"
                        onClick={() => setRevisitModalConceptId(c.id)}
                        className="shrink-0 rounded border border-indigo-200 px-2 py-0.5 text-[10px] font-semibold text-indigo-800"
                      >
                        Review
                      </button>
                      {revisitOk && (
                        <button
                          type="button"
                          title={bm ? "Remove bookmark" : "Bookmark for revisit"}
                          onClick={() => void toggleRevisitBookmark(c.id, bm)}
                          disabled={actionLoading}
                          className={`shrink-0 rounded p-1 ${bm ? "text-amber-700" : "text-slate-300 hover:text-amber-600"}`}
                        >
                          <Bookmark className={`h-3.5 w-3.5 ${bm ? "fill-current" : ""}`} />
                        </button>
                      )}
                    </>
                  )}
                  {isToday && <span className="shrink-0 text-[10px] font-bold uppercase text-indigo-600">Today</span>}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {revisitModalConcept && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="revisit-modal-title"
        >
          <div className="max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-t-2xl border border-prep-primary/15 bg-white shadow-2xl sm:rounded-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-prep-primary/10 bg-white px-4 py-3 sm:px-5">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-violet-700">Revisit</p>
                <h2 id="revisit-modal-title" className="text-lg font-bold text-prep-text">
                  {revisitModalConcept.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setRevisitModalConceptId(null)}
                className="shrink-0 rounded-lg p-2 text-prep-text-secondary hover:bg-slate-100 hover:text-prep-text"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto px-4 py-4 sm:max-h-[calc(92vh-8rem)] sm:px-5 sm:py-5">
              <p className="text-[14px] leading-relaxed text-prep-text-secondary">{revisitModalConcept.summary}</p>
              <SdConceptLearningContent
                concept={revisitModalConcept}
                practiceLead="Revisit practice"
                practiceHint="Run through the steps again without rushing. Close the Primer tab between sketch and compare if you want a stricter recall check."
              />
            </div>
            <div className="sticky bottom-0 flex flex-wrap items-center gap-2 border-t border-prep-primary/10 bg-slate-50/95 px-4 py-3 sm:px-5">
              {revisitOk && (
                <button
                  type="button"
                  onClick={() => void logRevisit(revisitModalConcept.id)}
                  disabled={actionLoading}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-[13px] font-bold text-white shadow-md transition hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 sm:flex-none"
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <History className="h-4 w-4" />}
                  Log revisit (+5 XP / day)
                </button>
              )}
              {revisitOk && (
                <button
                  type="button"
                  onClick={() =>
                    void toggleRevisitBookmark(revisitModalConcept.id, bookmarked.has(revisitModalConcept.id))
                  }
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 rounded-xl border border-prep-primary/20 px-4 py-3 text-[13px] font-medium text-prep-text"
                >
                  <Bookmark className={`h-4 w-4 ${bookmarked.has(revisitModalConcept.id) ? "fill-amber-500 text-amber-700" : ""}`} />
                  {bookmarked.has(revisitModalConcept.id) ? "Remove bookmark" : "Bookmark"}
                </button>
              )}
              <button
                type="button"
                onClick={() => setRevisitModalConceptId(null)}
                className="rounded-xl border border-prep-primary/15 px-4 py-3 text-[13px] font-medium text-prep-text-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
