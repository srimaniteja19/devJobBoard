import { z } from "zod";
import { isValidYMD } from "@/lib/date-helpers";

const ymd = z.string().refine((s) => isValidYMD(s), "Invalid YYYY-MM-DD");

export const sdStartSchema = z.object({
  startYmd: ymd.optional(),
});

export const sdCompleteSchema = z.object({
  conceptId: z.string().min(1).max(64),
  ymd: ymd,
});

export const sdRevisitConceptSchema = z.object({
  conceptId: z.string().min(1).max(64),
});

export const sdRevisitLogSchema = z.object({
  conceptId: z.string().min(1).max(64),
  ymd: ymd,
});
