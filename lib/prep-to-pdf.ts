import { jsPDF } from "jspdf";
import { PREP_SECTIONS_BY_STAGE, PREP_BUTTON_LABELS } from "./prep-config";
import { STATUS_LABELS } from "@/types";
import type { AppStatus } from "@/types";
const MARGIN = 20;
const LINE_HEIGHT = 6;
const SECTION_GAP = 10;
const FONT_SIZE = 10;
const FONT_SIZE_SMALL = 9;
const FONT_SIZE_HEADING = 14;
const FONT_SIZE_SECTION = 12;

function flattenContent(content: unknown): string[] {
  const lines: string[] = [];
  if (content == null) return lines;

  if (typeof content === "string") {
    return content.split("\n").filter(Boolean);
  }

  if (Array.isArray(content)) {
    for (const item of content) {
      if (typeof item === "object" && item !== null && !Array.isArray(item)) {
        const obj = item as Record<string, unknown>;
        for (const [k, v] of Object.entries(obj)) {
          const val = v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
          lines.push(`  • ${k}: ${val}`);
        }
      } else {
        lines.push(`  • ${typeof item === "object" ? JSON.stringify(item) : String(item)}`);
      }
    }
    return lines;
  }

  if (typeof content === "object" && content !== null) {
    const obj = content as Record<string, unknown>;
    for (const [k, v] of Object.entries(obj)) {
      if (v == null) continue;
      if (Array.isArray(v)) {
        lines.push(`${k}:`);
        for (const item of v) {
          lines.push(`  • ${typeof item === "object" ? JSON.stringify(item) : String(item)}`);
        }
      } else if (typeof v === "object" && v !== null && !Array.isArray(v)) {
        const nested = v as Record<string, unknown>;
        lines.push(`${k}:`);
        for (const [nk, nv] of Object.entries(nested)) {
          lines.push(`  ${nk}: ${nv == null ? "" : typeof nv === "object" ? JSON.stringify(nv) : String(nv)}`);
        }
      } else {
        lines.push(`${k}: ${String(v)}`);
      }
    }
  }
  return lines;
}

function getSectionText(sectionKey: string, content: unknown): string[] {
  const lines: string[] = [];
  if (content == null) return lines;

  const obj = typeof content === "object" && content !== null ? (content as Record<string, unknown>) : null;
  if (!obj) {
    return [String(content)];
  }

  // Section-specific extraction
  if (sectionKey === "likelyQuestions" && Array.isArray(obj.likelyQuestions)) {
    return (obj.likelyQuestions as string[]).map((q, i) => `${i + 1}. ${q}`);
  }
  if (sectionKey === "companyResearch") {
    const items = obj.items ?? obj.companyResearch;
    return Array.isArray(items) ? (items as string[]).map((r) => `• ${r}`) : flattenContent(obj);
  }
  if (sectionKey === "talkingPoints") {
    const pts = obj.points ?? obj.talkingPoints;
    return Array.isArray(pts) ? (pts as string[]).map((t) => `• ${t}`) : flattenContent(obj);
  }
  if (sectionKey === "starStories" && Array.isArray(obj.stories)) {
    const stories = obj.stories as Array<Record<string, string>>;
    const out: string[] = [];
    stories.forEach((s, i) => {
      out.push(`Story ${i + 1} — Use for: ${s.suggestedUse || "General"}`);
      out.push(`  Situation: ${s.situation || ""}`);
      out.push(`  Task: ${s.task || ""}`);
      out.push(`  Action: ${s.action || ""}`);
      out.push(`  Result: ${s.result || ""}`);
      out.push("");
    });
    return out;
  }

  return flattenContent(obj);
}

export function generatePrepPdf(
  role: string,
  company: string,
  stage: AppStatus,
  preps: Record<string, unknown>,
  tips: string[]
): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = 210; // A4 width in mm
  const pageHeight = 297; // A4 height in mm
  const maxWidth = pageWidth - 2 * MARGIN;

  let y = MARGIN;

  // Title
  doc.setFontSize(FONT_SIZE_HEADING);
  doc.setFont("helvetica", "bold");
  const title = `${role} at ${company}`;
  doc.text(title, MARGIN, y);
  y += LINE_HEIGHT * 2;

  doc.setFontSize(FONT_SIZE);
  doc.setFont("helvetica", "normal");
  const subtitle = `Prep for ${STATUS_LABELS[stage]} — ${PREP_BUTTON_LABELS[stage]}`;
  doc.text(subtitle, MARGIN, y);
  y += LINE_HEIGHT * 2;

  // Tips
  if (tips.length > 0) {
    doc.setFontSize(FONT_SIZE_SECTION);
    doc.setFont("helvetica", "bold");
    doc.text("Tips", MARGIN, y);
    y += LINE_HEIGHT;

    doc.setFontSize(FONT_SIZE_SMALL);
    doc.setFont("helvetica", "normal");
    for (const tip of tips) {
      const tipLines = doc.splitTextToSize(`• ${tip}`, maxWidth - 5);
      doc.text(tipLines, MARGIN + 3, y);
      y += tipLines.length * LINE_HEIGHT + 2;
    }
    y += SECTION_GAP;
  }

  const sections = PREP_SECTIONS_BY_STAGE[stage] ?? [];
  for (const section of sections) {
    const content = preps[section.key];
    if (!content) continue;

    doc.setFontSize(FONT_SIZE_SECTION);
    doc.setFont("helvetica", "bold");
    doc.text(section.label, MARGIN, y);
    y += LINE_HEIGHT;

    doc.setFontSize(FONT_SIZE_SMALL);
    doc.setFont("helvetica", "normal");

    const sectionLines = getSectionText(section.key, content);
    for (const line of sectionLines) {
      if (y > pageHeight - 25) {
        doc.addPage();
        y = MARGIN;
      }
      const wrapped = doc.splitTextToSize(line, maxWidth - 3);
      doc.text(wrapped, MARGIN + 3, y);
      y += wrapped.length * LINE_HEIGHT + 1;
    }
    y += SECTION_GAP;
  }

  return doc;
}
