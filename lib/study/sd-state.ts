import {
  nextRankProgress,
  parseJsonStringArray,
  parseJsonStringRecord,
  rankForXp,
  scheduledConceptId,
  scheduledConceptIndex,
} from "./sd-gamification";
import { fetchUserSdStudyRow } from "./sd-user-fetch";
import { SD_CURRICULUM, SD_CURRICULUM_VERSION, getConceptById, type SdConcept } from "./system-design-curriculum";

export type SdStatePayload = {
  version: number;
  curriculum: SdConcept[];
  startYmd: string | null;
  todayYmd: string;
  scheduledIndex: number;
  scheduledConceptId: string;
  completedIds: string[];
  revisitBookmarkIds: string[];
  revisitLastYmd: Record<string, string>;
  /** False until DB has sdRevisit* columns (run prisma db push / migrate). */
  revisitStorageReady: boolean;
  xp: number;
  currentStreak: number;
  longestStreak: number;
  rank: ReturnType<typeof rankForXp>;
  rankProgress: ReturnType<typeof nextRankProgress>;
  badgesUnlocked: string[];
  todayConcept: SdConcept;
  todayConceptCompleted: boolean;
  scheduledBonusAvailable: boolean;
};

function todayConceptForUser(
  startYmd: string | null,
  todayYmd: string,
  completedIds: string[]
): { concept: SdConcept; scheduledIndex: number; scheduledId: string; completed: boolean; bonusAvailable: boolean } {
  if (!startYmd) {
    const c = SD_CURRICULUM[0];
    return {
      concept: c,
      scheduledIndex: 0,
      scheduledId: c.id,
      completed: completedIds.includes(c.id),
      bonusAvailable: false,
    };
  }
  const idx = scheduledConceptIndex(startYmd, todayYmd);
  const sid = scheduledConceptId(startYmd, todayYmd);
  const concept = getConceptById(sid) ?? SD_CURRICULUM[0];
  const completed = completedIds.includes(concept.id);
  return {
    concept,
    scheduledIndex: idx,
    scheduledId: sid,
    completed,
    bonusAvailable: !completed,
  };
}

export async function buildSdStateForUser(userId: string, todayYmd: string): Promise<SdStatePayload> {
  const user = await fetchUserSdStudyRow(userId);

  const completedIds = user ? parseJsonStringArray(user.sdStudyCompletedIds) : [];
  const revisitBookmarkIds = user ? parseJsonStringArray(user.sdRevisitBookmarks) : [];
  const revisitLastYmd = user ? parseJsonStringRecord(user.sdRevisitLastYmd) : {};
  const xp = user?.sdStudyXp ?? 0;
  const startYmd = user?.sdStudyStartYmd ?? null;
  const revisitStorageReady = user ? user.revisitPersisted : true;
  const { concept, scheduledIndex, scheduledId, completed, bonusAvailable } = todayConceptForUser(
    startYmd,
    todayYmd,
    completedIds
  );

  const badgesUnlocked = user ? parseJsonStringArray(user.sdBadgesUnlocked) : [];

  return {
    version: SD_CURRICULUM_VERSION,
    curriculum: SD_CURRICULUM,
    startYmd,
    todayYmd,
    scheduledIndex,
    scheduledConceptId: scheduledId,
    completedIds,
    revisitBookmarkIds,
    revisitLastYmd,
    revisitStorageReady,
    xp,
    currentStreak: user?.sdStudyCurrentStreak ?? 0,
    longestStreak: user?.sdStudyLongestStreak ?? 0,
    rank: rankForXp(xp),
    rankProgress: nextRankProgress(xp),
    badgesUnlocked,
    todayConcept: concept,
    todayConceptCompleted: completed,
    scheduledBonusAvailable: bonusAvailable && !!startYmd,
  };
}
