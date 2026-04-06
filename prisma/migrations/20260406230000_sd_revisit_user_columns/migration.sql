-- System design revisit bookmarks (JSON string[] and Record<conceptId, ymd>)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sdRevisitBookmarks" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sdRevisitLastYmd" TEXT NOT NULL DEFAULT '{}';
