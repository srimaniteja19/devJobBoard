import type { AppStatus } from "@/types";
import {
  Target,
  Mail,
  Phone,
  GraduationCap,
  PiggyBank,
  Ghost,
  TrendingDown,
  type LucideIcon,
} from "lucide-react";

export const PREP_BUTTON_LABELS: Record<AppStatus, string> = {
  WISHLIST: "Should I Apply?",
  APPLIED: "Maximize Chances",
  SCREENING: "Prep for Screening",
  INTERVIEW: "Interview Prep",
  OFFER: "Negotiate Offer",
  REJECTED: "Learn & Improve",
  GHOSTED: "Re-engage or Pivot",
};

export interface PrepSectionConfig {
  key: string;
  label: string;
  icon: LucideIcon;
  description: string;
  emptyState: string;
}

export const PREP_SECTIONS_BY_STAGE: Record<AppStatus, PrepSectionConfig[]> = {
  WISHLIST: [
    { key: "roleFit", label: "Role Fit Analysis", icon: Target, description: "Resume vs JD match score", emptyState: "Generate role fit analysis" },
    { key: "companyScore", label: "Company Score Card", icon: TrendingDown, description: "Growth, stability, culture", emptyState: "Generate company score card" },
    { key: "salaryExpectation", label: "Salary Expectation", icon: PiggyBank, description: "Market rate for role + location", emptyState: "Generate salary expectation" },
    { key: "applicationStrategy", label: "Application Strategy", icon: Mail, description: "How to stand out, who to reach", emptyState: "Generate application strategy" },
    { key: "goNoGo", label: "Go / No-Go Verdict", icon: Target, description: "Honest recommendation", emptyState: "Generate go/no-go verdict" },
  ],
  APPLIED: [
    { key: "resumeTailoring", label: "Resume Tailoring Tips", icon: Mail, description: "Changes to make for this JD", emptyState: "Generate resume tailoring tips" },
    { key: "atsKeywords", label: "ATS Keyword Audit", icon: Target, description: "Missing keywords from JD", emptyState: "Generate ATS keyword audit" },
    { key: "coverLetter", label: "Cover Letter", icon: Mail, description: "Tailored cover letter", emptyState: "Generate cover letter" },
    { key: "linkedinOptimization", label: "LinkedIn Optimization", icon: Mail, description: "What to update on profile", emptyState: "Generate LinkedIn tips" },
    { key: "whoToContact", label: "Who to Contact", icon: Mail, description: "Recruiter, hiring manager outreach", emptyState: "Generate contact suggestions" },
    { key: "followUpTimeline", label: "Follow-up Timeline", icon: Mail, description: "When + how to follow up", emptyState: "Generate follow-up strategy" },
  ],
  SCREENING: [
    { key: "recruiterLookFor", label: "What Recruiters Look For", icon: Phone, description: "Red flags + green flags", emptyState: "Generate recruiter insights" },
    { key: "sixtySecondPitch", label: "60-Second Pitch", icon: Phone, description: "Tell me about yourself", emptyState: "Generate 60-second pitch" },
    { key: "screenerQuestions", label: "Likely Screener Questions", icon: Phone, description: "10 common phone screen questions", emptyState: "Generate screener questions" },
    { key: "salaryHandling", label: "Salary Handling", icon: PiggyBank, description: "Scripts for salary questions", emptyState: "Generate salary scripts" },
    { key: "questionsToAsk", label: "Questions to Ask", icon: Phone, description: "5 smart recruiter questions", emptyState: "Generate questions to ask" },
    { key: "nextStepSignals", label: "Next Step Signals", icon: Phone, description: "How to read if screen went well", emptyState: "Generate next-step signals" },
  ],
  INTERVIEW: [
    { key: "likelyQuestions", label: "Questions Bank", icon: GraduationCap, description: "Likely interview questions", emptyState: "Generate likely questions" },
    { key: "companyResearch", label: "Company Brief", icon: Target, description: "Research about company", emptyState: "Generate company research" },
    { key: "talkingPoints", label: "Resume Talking Points", icon: GraduationCap, description: "What to highlight from resume", emptyState: "Generate talking points" },
    { key: "starStories", label: "STAR Story Bank", icon: GraduationCap, description: "STAR format stories", emptyState: "Generate STAR stories" },
    { key: "interviewQuestionsToAsk", label: "Questions to Ask", icon: GraduationCap, description: "Smart questions for interviewers", emptyState: "Generate questions to ask" },
    { key: "redFlagsSalary", label: "Red Flags & Salary Intel", icon: PiggyBank, description: "What to watch for", emptyState: "Generate red flags & salary intel" },
  ],
  OFFER: [
    { key: "offerEvaluation", label: "Offer Evaluation", icon: PiggyBank, description: "Is this offer fair?", emptyState: "Generate offer evaluation" },
    { key: "negotiationScript", label: "Negotiation Script", icon: PiggyBank, description: "Word-for-word dialogue", emptyState: "Generate negotiation script" },
    { key: "counterOfferCalculator", label: "Counter Offer Calculator", icon: PiggyBank, description: "What to ask based on market", emptyState: "Generate counter offer guide" },
    { key: "benefitsNegotiation", label: "Benefits Negotiation", icon: PiggyBank, description: "PTO, equity, remote, signing", emptyState: "Generate benefits negotiation tips" },
    { key: "competingLeverage", label: "Competing Offer Leverage", icon: PiggyBank, description: "Using other applications", emptyState: "Generate competing offer strategy" },
    { key: "acceptDeclineScript", label: "Accept / Decline Script", icon: Mail, description: "Professional language", emptyState: "Generate accept/decline scripts" },
    { key: "ninetyDayPlan", label: "30-60-90 Day Plan", icon: Target, description: "Prepare before day one", emptyState: "Generate 30-60-90 day plan" },
  ],
  REJECTED: [
    { key: "rejectionAnalysis", label: "Rejection Analysis", icon: TrendingDown, description: "Likely reasons", emptyState: "Generate rejection analysis" },
    { key: "whatToImprove", label: "What to Improve", icon: Target, description: "Skills/experience gaps", emptyState: "Generate improvement suggestions" },
    { key: "followUpEmail", label: "Follow-up Email", icon: Mail, description: "Graceful reply", emptyState: "Generate follow-up email" },
    { key: "similarCompanies", label: "Similar Companies", icon: Target, description: "5 companies to apply to", emptyState: "Generate similar companies" },
    { key: "skillGapRoadmap", label: "Skill Gap Roadmap", icon: GraduationCap, description: "30/60/90 day plan to close gaps", emptyState: "Generate skill gap roadmap" },
  ],
  GHOSTED: [
    { key: "reengagementEmail", label: "Re-engagement Email", icon: Mail, description: "Tasteful bump email", emptyState: "Generate re-engagement email" },
    { key: "readSignals", label: "Read the Signals", icon: Ghost, description: "Truly ghosted or just slow?", emptyState: "Generate signal analysis" },
    { key: "followUpOrMoveOn", label: "Follow Up vs Move On", icon: Target, description: "Decision framework", emptyState: "Generate decision guidance" },
    { key: "alternativeContacts", label: "Alternative Contacts", icon: Mail, description: "Who else to reach out to", emptyState: "Generate alternative contacts" },
    { key: "pivotStrategy", label: "Pivot Strategy", icon: Target, description: "Similar roles/companies", emptyState: "Generate pivot strategy" },
  ],
};
