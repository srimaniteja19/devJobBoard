import type { AppStatus } from "@/types";

export interface PrepContext {
  role: string;
  company: string;
  location?: string | null;
  type?: string;
  stack: string[];
  salary?: string | null;
  notes?: string | null;
  resumeText: string;
  status: string;
}

function baseContext(ctx: PrepContext): string {
  return `You are an expert career coach.
Role: ${ctx.role} at ${ctx.company}
Location: ${ctx.location || "unspecified"} | Type: ${ctx.type || "unspecified"} | Stack: ${ctx.stack.length ? ctx.stack.join(", ") : "unspecified"}
Salary range: ${ctx.salary || "unspecified"}
Job notes/JD: ${ctx.notes || "none"}
Candidate resume: ${ctx.resumeText || "not provided"}
Current application stage: ${ctx.status}
Return ONLY valid JSON. No markdown, no backticks, no explanation.`;
}

export function getPrepPrompt(stage: AppStatus, sectionKey: string, ctx: PrepContext): { systemInstruction: string; userInput: string } {
  const base = baseContext(ctx);

  const prompts: Partial<Record<AppStatus, Record<string, string>>> = {
    WISHLIST: {
      roleFit: `Analyze how well this candidate fits this role. Return:
{
  "overallScore": number,
  "scoreBreakdown": { "skillsMatch": number, "experienceLevel": number, "industryFit": number, "locationFit": number },
  "strongMatches": string[],
  "concerningGaps": string[],
  "fitSummary": string
}`,
      companyScore: `Evaluate ${ctx.company} as an employer. Return:
{
  "overallScore": number,
  "scores": { "growthTrajectory": number, "jobSecurity": number, "cultureFit": number, "compensationFairness": number, "careerGrowth": number },
  "pros": string[],
  "cons": string[],
  "verdict": string
}`,
      salaryExpectation: `Estimate market salary for this role. Return:
{
  "low": number,
  "mid": number,
  "high": number,
  "currency": "USD",
  "notes": string
}`,
      applicationStrategy: `How to stand out and who to reach. Return:
{
  "howToStandOut": string[],
  "whoToReach": string[],
  "outreachSuggestions": string[]
}`,
      goNoGo: `Based on candidate profile, company, role — give direct recommendation. Return:
{
  "decision": "STRONG YES" | "YES" | "MAYBE" | "NO" | "STRONG NO",
  "confidence": number,
  "topReasonToApply": string,
  "topReasonNotTo": string,
  "finalAdvice": string
}`,
    },
    APPLIED: {
      resumeTailoring: `Specific changes to make to resume for this JD. Return:
{
  "tips": string[],
  "priorityChanges": string[],
  "examples": string[]
}`,
      atsKeywords: `Compare JD notes against resume. Return:
{
  "presentKeywords": string[],
  "missingKeywords": string[],
  "suggestedAdditions": [{ "keyword": string, "whereToAdd": string, "suggestedPhrase": string }],
  "atsScoreEstimate": number
}`,
      coverLetter: `Generate tailored cover letter. Return:
{
  "opening": string,
  "body": string,
  "closing": string,
  "fullLetter": string
}`,
      linkedinOptimization: `What to update on LinkedIn before they look. Return:
{
  "headline": string,
  "summarySuggestions": string[],
  "experienceUpdates": string[],
  "skillsToHighlight": string[]
}`,
      whoToContact: `Who to reach out to. Return:
{
  "suggestedContacts": [{ "role": string, "platform": string, "approach": string }],
  "outreachTemplate": string
}`,
      followUpTimeline: `Follow-up strategy after applying. Return:
{
  "timeline": [{ "dayAfterApply": number, "action": string, "channel": "email" | "linkedin" | "phone", "messageTemplate": string, "toneNote": string }],
  "maxFollowUps": number,
  "whenToGiveUp": string
}`,
    },
    SCREENING: {
      recruiterLookFor: `What recruiters look for (red/green flags). Return:
{
  "redFlags": string[],
  "greenFlags": string[],
  "companySpecific": string[]
}`,
      sixtySecondPitch: `Tailored 60-second pitch. Return:
{
  "pitch": string,
  "keyPoints": string[],
  "customizationNotes": string
}`,
      screenerQuestions: `10 common phone screen questions for this role. Return:
{
  "questions": string[],
  "tipPerQuestion": string[]
}`,
      salaryHandling: `Salary negotiation scripts for phone screen. Return:
{
  "marketRate": { "low": number, "mid": number, "high": number },
  "deflectScript": string,
  "anchorHighScript": string,
  "responseToLowball": string,
  "responseToFairOffer": string,
  "keyPrinciples": string[]
}`,
      questionsToAsk: `5 smart questions for recruiter. Return:
{
  "questions": string[],
  "whyAsk": string[]
}`,
      nextStepSignals: `Signals phone screen went well vs poorly. Return:
{
  "positiveSignals": string[],
  "negativeSignals": string[],
  "neutralSignals": string[],
  "followUpEmail": string,
  "waitTime": string,
  "ifNoResponse": string
}`,
    },
    INTERVIEW: {
      likelyQuestions: `6–8 interview questions for this role. Mix behavioral, technical, role-specific. Return:
{
  "likelyQuestions": string[]
}`,
      companyResearch: `4–6 things to research about ${ctx.company}. Return:
{
  "items": string[],
  "priorityOrder": string[]
}`,
      talkingPoints: `5–7 talking points from experience aligning with JD. Return:
{
  "points": string[],
  "resumeHooks": string[]
}`,
      starStories: `2–4 STAR story suggestions. Return:
{
  "stories": [{ "situation": string, "task": string, "action": string, "result": string, "suggestedUse": string }]
}`,
      interviewQuestionsToAsk: `5 smart questions for interviewers. Return:
{
  "questions": string[],
  "rationale": string[]
}`,
      redFlagsSalary: `Red flags and salary intel. Return:
{
  "redFlags": string[],
  "salaryIntel": string,
  "negotiationNotes": string[]
}`,
    },
    OFFER: {
      offerEvaluation: `Evaluate this job offer. Return:
{
  "overallScore": number,
  "salaryFairness": "below market" | "at market" | "above market",
  "marketSalary": { "low": number, "mid": number, "high": number },
  "offerVsMarket": string,
  "negotiationRoom": "low" | "medium" | "high",
  "mustNegotiate": boolean,
  "verdict": string
}`,
      negotiationScript: `Word-for-word negotiation dialogue. Return:
{
  "opening": string,
  "ifTheyPushBack": string,
  "counterTactics": string[],
  "closing": string
}`,
      counterOfferCalculator: `What to ask for based on market. Return:
{
  "suggestedRange": { "low": number, "high": number },
  "askAmount": number,
  "reasoning": string[],
  "anchoringPhrase": string
}`,
      benefitsNegotiation: `Negotiation beyond salary. Return:
{
  "areas": string[],
  "tips": string[],
  "scripts": Record<string, string>
}`,
      competingLeverage: `Using other applications as leverage. Return:
{
  "howToUse": string[],
  "scripts": string[],
  "ethics": string
}`,
      acceptDeclineScript: `Professional accept/decline language. Return:
{
  "acceptScript": string,
  "declineScript": string,
  "emailTemplates": { "accept": string, "decline": string }
}`,
      ninetyDayPlan: `30-60-90 day plan for first days. Return:
{
  "before_day_one": string[],
  "days_1_30": { "theme": string, "goals": string[], "keyActions": string[] },
  "days_31_60": { "theme": string, "goals": string[], "keyActions": string[] },
  "days_61_90": { "theme": string, "goals": string[], "keyActions": string[] },
  "successMetrics": string[]
}`,
    },
    REJECTED: {
      rejectionAnalysis: `Analyze likely rejection reasons. Return:
{
  "likelyReasons": [{ "reason": string, "probability": "high" | "medium" | "low", "evidence": string }],
  "wasItFit": boolean,
  "wasItTiming": boolean,
  "wasItCompetition": boolean,
  "keyTakeaway": string,
  "dontTakeItPersonally": string
}`,
      whatToImprove: `Specific skills/experience gaps. Return:
{
  "gaps": string[],
  "priorityOrder": string[],
  "resources": string[]
}`,
      followUpEmail: `Graceful reply to keep door open. Return:
{
  "subject": string,
  "body": string,
  "tone": string
}`,
      similarCompanies: `5 companies to apply to instead. Return:
{
  "companies": [{ "name": string, "why": string }],
  "whereToFind": string
}`,
      skillGapRoadmap: `30/60/90 day plan to close gaps. Return:
{
  "criticalGaps": string[],
  "plan": {
    "days_1_30": [{ "action": string, "resource": string, "outcome": string }],
    "days_31_60": [{ "action": string, "resource": string, "outcome": string }],
    "days_61_90": [{ "action": string, "resource": string, "outcome": string }]
  },
  "expectedOutcome": string
}`,
    },
    GHOSTED: {
      reengagementEmail: `Tasteful bump email. Return:
{
  "subject": string,
  "body": string,
  "tone": string
}`,
      readSignals: `Is this truly ghosted or just slow? Return:
{
  "ghostProbability": number,
  "likelyReason": string,
  "industryNorm": string,
  "recommendation": "follow_up" | "move_on" | "wait_longer",
  "daysToWait": number,
  "explanation": string
}`,
      followUpOrMoveOn: `Decision: follow up vs move on. Return:
{
  "recommendation": string,
  "prosCons": { "followUp": string[], "moveOn": string[] },
  "nextSteps": string[]
}`,
      alternativeContacts: `Who else at company to reach out to. Return:
{
  "contacts": [{ "role": string, "approach": string }],
  "messageTemplate": string
}`,
      pivotStrategy: `Similar roles/companies to redirect. Return:
{
  "similarRoles": string[],
  "similarCompanies": string[],
  "whereToLook": string[]
}`,
    },
  };

  const stagePrompts = prompts[stage];
  const prompt = stagePrompts?.[sectionKey];

  if (!prompt) {
    throw new Error(`No prompt for stage=${stage} section=${sectionKey}`);
  }

  return {
    systemInstruction: base,
    userInput: prompt,
  };
}
