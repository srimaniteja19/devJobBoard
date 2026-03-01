import { z } from "zod";

const optionalUrl = z.string().url().or(z.literal("")).transform((v) => v || undefined).optional();
const optionalStr = z.string().transform((v) => v?.trim() || undefined).optional();

export const applicationSchema = z.object({
  company: z.string().min(1, "Company is required").trim(),
  role: z.string().min(1, "Role is required").trim(),
  jobUrl: optionalUrl,
  salary: optionalStr,
  location: optionalStr,
  type: z.enum(["REMOTE", "HYBRID", "ONSITE"]).default("REMOTE"),
  stack: z.array(z.string()).default([]),
  status: z
    .enum(["WISHLIST", "APPLIED", "SCREENING", "INTERVIEW", "OFFER", "REJECTED", "GHOSTED"])
    .default("APPLIED"),
  resumeLabel: optionalStr,
  appliedAt: optionalStr,
  notes: optionalStr,
});

export type ApplicationFormData = z.infer<typeof applicationSchema>;

export const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  role: optionalStr,
  email: z.string().email("Invalid email").or(z.literal("")).transform((v) => v || undefined).optional(),
  linkedin: optionalUrl,
  notes: optionalStr,
});

export type ContactFormData = z.infer<typeof contactSchema>;

export const eventSchema = z.object({
  type: z
    .enum(["PHONE_SCREEN", "TECHNICAL", "BEHAVIORAL", "ONSITE", "OFFER", "REJECTION", "FOLLOW_UP", "OTHER"])
    .default("OTHER"),
  scheduledAt: z.string().min(1, "Date is required"),
  notes: optionalStr,
});

export type EventFormData = z.infer<typeof eventSchema>;
