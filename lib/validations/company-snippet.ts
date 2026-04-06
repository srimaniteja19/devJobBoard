import { z } from "zod";

export const companySnippetCreateSchema = z.object({
  company: z.string().trim().min(1).max(200),
  content: z.string().trim().min(1).max(10000),
  source: z.enum(["manual", "chat", "notes"]).optional(),
  applicationId: z.string().cuid().optional().nullable(),
});

export const companySnippetUpdateSchema = z.object({
  content: z.string().trim().min(1).max(10000),
});
