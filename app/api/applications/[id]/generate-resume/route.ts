import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticatedAction } from "@/lib/api-auth";
import { getGeminiClient, generateJson } from "@/lib/gemini";

function parseStack(stack: string): string[] {
  try {
    const arr = JSON.parse(stack);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, unauthorized } = await authenticatedAction();
  if (unauthorized) return unauthorized;

  const app = await prisma.application.findFirst({
    where: { id: params.id, userId: user.id },
  });
  if (!app) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const resumes = await prisma.generatedResume.findMany({
    where: { applicationId: params.id },
    orderBy: { version: "desc" },
  });

  return NextResponse.json(resumes);
}

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, unauthorized } = await authenticatedAction();
  if (unauthorized) return unauthorized;

  try {
    const app = await prisma.application.findFirst({
      where: { id: params.id, userId: user.id },
      select: {
        role: true,
        company: true,
        notes: true,
        stack: true,
        resumeText: true,
      },
    });

    if (!app) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const resumeText = app.resumeText?.trim();
    const notes = (app.notes ?? "").trim();

    if (!resumeText) {
      return NextResponse.json(
        { error: "No resume uploaded. Upload a resume first." },
        { status: 400 }
      );
    }

    if (!notes) {
      return NextResponse.json(
        { error: "No job description. Add JD from URL or paste manually." },
        { status: 400 }
      );
    }

    const stack = parseStack(app.stack);
    const stackStr = stack.length > 0 ? stack.join(", ") : "not specified";

    // Step 1 — Parse resume structure
    const parsePrompt = `Parse this resume and extract its complete structure and content.
Return ONLY valid JSON with this structure (use empty arrays/strings where missing):
{
  "format": {
    "hasPhoto": false,
    "columnLayout": "single",
    "sectionOrder": ["summary","experience","skills"],
    "bulletStyle": "•",
    "dateFormat": "MMM YYYY",
    "hasSummary": true,
    "hasObjective": false
  },
  "contact": {
    "name": "",
    "email": "",
    "phone": "",
    "location": "",
    "linkedin": "",
    "github": "",
    "portfolio": ""
  },
  "summary": "",
  "experience": [{
    "company": "",
    "title": "",
    "startDate": "",
    "endDate": "",
    "location": "",
    "bullets": []
  }],
  "education": [{
    "institution": "",
    "degree": "",
    "field": "",
    "graduationDate": "",
    "gpa": "",
    "highlights": []
  }],
  "skills": {
    "categories": [{"name": "", "skills": []}]
  },
  "projects": [{
    "name": "",
    "description": "",
    "techStack": [],
    "bullets": [],
    "link": ""
  }],
  "certifications": [{"name": "", "issuer": "", "date": ""}],
  "additionalSections": [{"title": "", "content": ""}]
}

Resume text:
${resumeText.slice(0, 15000)}`;

    const parsedResume = (await generateJson(
      "You extract resume structure. Return ONLY valid JSON. No markdown.",
      parsePrompt
    )) as Record<string, unknown>;

    // Step 2 — Generate tailored content
    const tailorPrompt = `You are an expert resume writer. Rewrite this candidate's resume content to be perfectly tailored for the target job.

RULES:
- Keep ALL real experience, education, and facts — never fabricate
- Rewrite bullets to emphasize what's most relevant to the JD
- Add missing JD keywords naturally into existing bullets
- Reorder experience bullets: most JD-relevant first
- Rewrite summary specifically for this role and company
- Reorder skills to match JD priority
- Surface most relevant projects, push irrelevant ones down
- Quantify achievements where possible (keep existing numbers)
- Use strong action verbs that match the JD's language
- Keep the EXACT same structure/format as the original

Target Job: ${app.role} at ${app.company}
Job Description: ${notes.slice(0, 6000)}
Required Stack: ${stackStr}

Original Resume Structure: ${JSON.stringify(parsedResume)}

Return the same JSON structure with rewritten content. Every field must be populated. Return ONLY valid JSON.`;

    const tailoredResume = (await generateJson(
      "You rewrite resume content for a target job. Return ONLY valid JSON.",
      tailorPrompt
    )) as Record<string, unknown>;

    // Step 3 — Render as HTML (raw text, not JSON)
    const genAI = getGeminiClient();
    const htmlModel = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      generationConfig: { temperature: 0.3 },
    });

    const bulletStyle =
      (tailoredResume?.format as Record<string, unknown>)?.bulletStyle ?? "•";
    const htmlPrompt = `Convert this resume JSON into a clean, ATS-friendly, professionally formatted HTML resume.

FORMATTING RULES:
- Single page if possible, max 2 pages
- Clean typography: font-family Georgia for name, Arial for body (ATS safe only)
- Standard margins: 0.5-0.75 inch
- Section headers in uppercase with a thin bottom border
- Bullet points with: ${bulletStyle}
- Dates right-aligned on same line as company/title
- No tables, no columns, no text boxes
- No images, no icons
- Hyperlinks for email, linkedin, github
- Inline CSS only
- Include @media print { body { background: white; } } for print
- Optional: highlight newly added keywords with style='background: #fffde7' (screen only)

Resume JSON: ${JSON.stringify(tailoredResume)}

Return complete, valid HTML document starting with <!DOCTYPE html>.`;

    const htmlResult = await htmlModel.generateContent(htmlPrompt);
    let htmlContent = htmlResult?.response?.text?.() ?? "";

    if (!htmlContent.includes("<!DOCTYPE") && !htmlContent.includes("<html")) {
      htmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;margin:0.75in;font-size:11pt;} .name{font-family:Georgia,serif;font-size:22pt;} .section{text-transform:uppercase;border-bottom:1px solid #000;margin-top:12pt;} .bullet{margin:4pt 0;} @media print{body{background:white;}}</style></head><body><pre>${htmlContent.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre></body></html>`;
    }

    // Build a simple changes summary
    const originalSummary =
      (parsedResume?.summary as string) ?? "";
    const newSummary = (tailoredResume?.summary as string) ?? "";
    const changesSummary = JSON.stringify({
      summaryRewritten: originalSummary !== newSummary,
      bulletsOptimized: true,
      keywordsAdded: [],
      skillsReordered: true,
      projectsReshuffled: true,
      originalSummaryPreview: originalSummary.slice(0, 150),
      newSummaryPreview: newSummary.slice(0, 150),
    });

    const latest = await prisma.generatedResume.findFirst({
      where: { applicationId: params.id },
      orderBy: { version: "desc" },
    });
    const version = (latest?.version ?? 0) + 1;

    await prisma.generatedResume.create({
      data: {
        applicationId: params.id,
        htmlContent,
        jsonContent: JSON.stringify(tailoredResume),
        changesSummary,
        version,
      },
    });

    return NextResponse.json({
      html: htmlContent,
      tailoredResume,
      changesSummary: JSON.parse(changesSummary),
      version,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal error";
    console.error("Generate resume error:", msg);
    return NextResponse.json(
      { error: msg.includes("not configured") ? "Gemini not configured" : "Generation failed. Try again." },
      { status: 500 }
    );
  }
}
