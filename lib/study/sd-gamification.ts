import { diffCalendarDaysYMD } from "./sd-dates";
import { SD_CURRICULUM } from "./system-design-curriculum";

export const XP_PER_CONCEPT = 100;
export const XP_BONUS_SCHEDULED_DAY = 50;

export type SdBadge = {
  id: string;
  title: string;
  description: string;
  icon: "zap" | "flame" | "trophy" | "star" | "target" | "crown";
};

export const SD_BADGES: SdBadge[] = [
  { id: "first_step", title: "First step", description: "Complete your first concept", icon: "zap" },
  { id: "on_fire", title: "On fire", description: "Reach a 3-day streak", icon: "flame" },
  { id: "week_warrior", title: "Week warrior", description: "7-day streak", icon: "trophy" },
  { id: "fundamentals", title: "Foundation laid", description: "Finish the first 10 concepts", icon: "target" },
  { id: "halfway_hero", title: "Halfway hero", description: "Complete 50% of the track", icon: "star" },
  { id: "system_sage", title: "System sage", description: "Complete every concept in the curriculum", icon: "crown" },
  { id: "xp_1k", title: "Point collector", description: "Earn 1,000 total XP", icon: "star" },
  { id: "xp_3k", title: "XP grinder", description: "Earn 3,000 total XP", icon: "trophy" },
];

export type SdRank = { id: string; title: string; minXp: number };

export const SD_RANKS: SdRank[] = [
  { id: "novice", title: "Diagram doodler", minXp: 0 },
  { id: "apprentice", title: "Box & arrow apprentice", minXp: 400 },
  { id: "builder", title: "Scale-minded builder", minXp: 900 },
  { id: "architect", title: "Trade-off architect", minXp: 1800 },
  { id: "principal", title: "Principal path", minXp: 3200 },
];

export function rankForXp(xp: number): SdRank {
  let r = SD_RANKS[0];
  for (const rank of SD_RANKS) {
    if (xp >= rank.minXp) r = rank;
  }
  return r;
}

export function nextRankProgress(xp: number): { current: SdRank; next: SdRank | null; pct: number } {
  const current = rankForXp(xp);
  const idx = SD_RANKS.findIndex((r) => r.id === current.id);
  const next = SD_RANKS[idx + 1] ?? null;
  if (!next) return { current, next: null, pct: 100 };
  const span = next.minXp - current.minXp;
  const inSpan = xp - current.minXp;
  const pct = Math.min(100, Math.round((inSpan / span) * 100));
  return { current, next, pct };
}

export function scheduledConceptIndex(startYmd: string, todayYmd: string): number {
  const d = diffCalendarDaysYMD(startYmd, todayYmd);
  if (d < 0) return 0;
  return Math.min(d, SD_CURRICULUM.length - 1);
}

export function scheduledConceptId(startYmd: string, todayYmd: string): string {
  return SD_CURRICULUM[scheduledConceptIndex(startYmd, todayYmd)].id;
}

export function parseJsonStringArray(raw: string): string[] {
  try {
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function updateStreakOnComplete(
  lastActiveYmd: string | null,
  completeYmd: string,
  currentStreak: number,
  longestStreak: number
): { streak: number; longest: number } {
  if (!lastActiveYmd) {
    const s = 1;
    return { streak: s, longest: Math.max(longestStreak, s) };
  }
  if (lastActiveYmd === completeYmd) {
    return { streak: currentStreak, longest: longestStreak };
  }
  const gap = diffCalendarDaysYMD(lastActiveYmd, completeYmd);
  if (gap === 1) {
    const s = currentStreak + 1;
    return { streak: s, longest: Math.max(longestStreak, s) };
  }
  const s = 1;
  return { streak: s, longest: Math.max(longestStreak, s) };
}

export function computeNewBadges(params: {
  completedIds: string[];
  xp: number;
  currentStreak: number;
  previouslyUnlocked: Set<string>;
}): SdBadge[] {
  const { completedIds, xp, currentStreak, previouslyUnlocked } = params;
  const n = completedIds.length;
  const total = SD_CURRICULUM.length;
  const half = Math.ceil(total / 2);
  const checks: { id: string; ok: boolean }[] = [
    { id: "first_step", ok: n >= 1 },
    { id: "on_fire", ok: currentStreak >= 3 },
    { id: "week_warrior", ok: currentStreak >= 7 },
    { id: "fundamentals", ok: n >= 10 },
    { id: "halfway_hero", ok: n >= half },
    { id: "system_sage", ok: n >= total },
    { id: "xp_1k", ok: xp >= 1000 },
    { id: "xp_3k", ok: xp >= 3000 },
  ];
  const out: SdBadge[] = [];
  for (const { id, ok } of checks) {
    if (ok && !previouslyUnlocked.has(id)) {
      const b = SD_BADGES.find((x) => x.id === id);
      if (b) out.push(b);
    }
  }
  return out;
}

export function totalXpForCompletion(
  conceptId: string,
  scheduledId: string,
  alreadyCompleted: boolean
): { xp: number; bonusScheduled: boolean } {
  if (alreadyCompleted) return { xp: 0, bonusScheduled: false };
  const bonusScheduled = conceptId === scheduledId;
  return {
    xp: XP_PER_CONCEPT + (bonusScheduled ? XP_BONUS_SCHEDULED_DAY : 0),
    bonusScheduled,
  };
}
