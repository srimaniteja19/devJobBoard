import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

const SD_STUDY_SELECT_WITH_REVISIT = {
  sdStudyStartYmd: true,
  sdStudyCompletedIds: true,
  sdStudyXp: true,
  sdStudyCurrentStreak: true,
  sdStudyLongestStreak: true,
  sdStudyLastActiveYmd: true,
  sdBadgesUnlocked: true,
  sdRevisitBookmarks: true,
  sdRevisitLastYmd: true,
} as const;

const SD_STUDY_SELECT_LEGACY = {
  sdStudyStartYmd: true,
  sdStudyCompletedIds: true,
  sdStudyXp: true,
  sdStudyCurrentStreak: true,
  sdStudyLongestStreak: true,
  sdStudyLastActiveYmd: true,
  sdBadgesUnlocked: true,
} as const;

export type SdUserStudyRow = {
  sdStudyStartYmd: string | null;
  sdStudyCompletedIds: string;
  sdStudyXp: number;
  sdStudyCurrentStreak: number;
  sdStudyLongestStreak: number;
  sdStudyLastActiveYmd: string | null;
  sdBadgesUnlocked: string;
  sdRevisitBookmarks: string;
  sdRevisitLastYmd: string;
  /** False when the database has not been migrated with revisit columns yet. */
  revisitPersisted: boolean;
};

function isMissingColumnError(e: unknown): boolean {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2022") {
    return true;
  }
  const msg = e instanceof Error ? e.message : String(e);
  return /does not exist|Unknown column/i.test(msg);
}

/**
 * Loads User fields for system-design study. If `sdRevisitBookmarks` / `sdRevisitLastYmd`
 * are missing in the DB (migrate not applied), falls back to a smaller select and in-memory
 * defaults so GET /api/study/system-design still works.
 */
export async function fetchUserSdStudyRow(userId: string): Promise<SdUserStudyRow | null> {
  try {
    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: SD_STUDY_SELECT_WITH_REVISIT,
    });
    if (!u) return null;
    return {
      ...u,
      revisitPersisted: true,
    };
  } catch (e) {
    if (!isMissingColumnError(e)) throw e;
    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: SD_STUDY_SELECT_LEGACY,
    });
    if (!u) return null;
    return {
      ...u,
      sdRevisitBookmarks: "[]",
      sdRevisitLastYmd: "{}",
      revisitPersisted: false,
    };
  }
}
