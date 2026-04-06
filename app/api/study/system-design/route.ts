import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticatedAction } from "@/lib/api-auth";
import { isValidYMD, toYMDLocal } from "@/lib/date-helpers";
import {
  computeNewBadges,
  parseJsonStringArray,
  scheduledConceptId,
  totalXpForCompletion,
  updateStreakOnComplete,
} from "@/lib/study/sd-gamification";
import { buildSdStateForUser } from "@/lib/study/sd-state";
import { getConceptById } from "@/lib/study/system-design-curriculum";
import { sdCompleteSchema, sdStartSchema } from "@/lib/validations/sd-study";

export async function GET(req: NextRequest) {
  const { user, unauthorized } = await authenticatedAction();
  if (unauthorized) return unauthorized;

  const ymdParam = req.nextUrl.searchParams.get("ymd");
  const todayYmd =
    ymdParam && isValidYMD(ymdParam) ? ymdParam : toYMDLocal(new Date());

  try {
    const state = await buildSdStateForUser(user.id, todayYmd);
    return NextResponse.json(state);
  } catch (e) {
    console.error("SD study GET:", e);
    return NextResponse.json({ error: "Failed to load study state" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { user, unauthorized } = await authenticatedAction();
  if (unauthorized) return unauthorized;

  let action: string | null = null;
  try {
    const body = await req.json();
    action = typeof body?.action === "string" ? body.action : null;

    if (action === "start") {
      const parsed = sdStartSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
      }
      const startYmd = parsed.data.startYmd ?? toYMDLocal(new Date());

      await prisma.user.update({
        where: { id: user.id },
        data: { sdStudyStartYmd: startYmd },
      });

      const state = await buildSdStateForUser(user.id, toYMDLocal(new Date()));
      return NextResponse.json({ ok: true, state });
    }

    if (action === "complete") {
      const parsed = sdCompleteSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
      }
      const { conceptId, ymd } = parsed.data;

      const concept = getConceptById(conceptId);
      if (!concept) {
        return NextResponse.json({ error: "Unknown concept" }, { status: 400 });
      }

      const u = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          sdStudyStartYmd: true,
          sdStudyCompletedIds: true,
          sdStudyXp: true,
          sdStudyCurrentStreak: true,
          sdStudyLongestStreak: true,
          sdStudyLastActiveYmd: true,
          sdBadgesUnlocked: true,
        },
      });
      if (!u) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const completed = parseJsonStringArray(u.sdStudyCompletedIds);
      const already = completed.includes(conceptId);
      let effectiveStart = u.sdStudyStartYmd;
      if (!effectiveStart && !already) {
        effectiveStart = ymd;
      }
      const startYmd = effectiveStart ?? ymd;
      const scheduledId = scheduledConceptId(startYmd, ymd);
      const { xp: addXp, bonusScheduled } = totalXpForCompletion(conceptId, scheduledId, already);

      let newCompleted = completed;
      let newXp = u.sdStudyXp;
      let newStreak = u.sdStudyCurrentStreak;
      let newLongest = u.sdStudyLongestStreak;
      let lastActive = u.sdStudyLastActiveYmd;
      const prevBadges = new Set(parseJsonStringArray(u.sdBadgesUnlocked));

      if (!already) {
        newCompleted = [...completed, conceptId];
        newXp = u.sdStudyXp + addXp;
        const streakUp = updateStreakOnComplete(
          u.sdStudyLastActiveYmd,
          ymd,
          u.sdStudyCurrentStreak,
          u.sdStudyLongestStreak
        );
        newStreak = streakUp.streak;
        newLongest = streakUp.longest;
        lastActive = ymd;
      }

      const newBadges = computeNewBadges({
        completedIds: newCompleted,
        xp: newXp,
        currentStreak: newStreak,
        previouslyUnlocked: prevBadges,
      });

      const badgeIds = new Set([...parseJsonStringArray(u.sdBadgesUnlocked), ...newBadges.map((b) => b.id)]);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          sdStudyStartYmd: u.sdStudyStartYmd ?? (!already ? ymd : undefined),
          sdStudyCompletedIds: JSON.stringify(newCompleted),
          sdStudyXp: newXp,
          sdStudyCurrentStreak: newStreak,
          sdStudyLongestStreak: newLongest,
          sdStudyLastActiveYmd: lastActive,
          sdBadgesUnlocked: JSON.stringify(Array.from(badgeIds)),
        },
      });

      const state = await buildSdStateForUser(user.id, ymd);
      return NextResponse.json({
        ok: true,
        alreadyCompleted: already,
        xpGained: addXp,
        bonusScheduled: already ? false : bonusScheduled,
        newBadges,
        state,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    console.error("SD study POST:", e);
    return NextResponse.json({ error: "Request failed" }, { status: 500 });
  }
}
