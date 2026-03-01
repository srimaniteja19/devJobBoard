/**
 * Client-side text extraction for chat file attachments (PDF, DOCX, TXT).
 * Use only in "use client" components.
 */

const MAX_CHARS = 15000;

export async function extractTextFromFile(file: File): Promise<string> {
  const name = (file.name || "").toLowerCase();
  const type = (file.type || "").toLowerCase();

  if (type === "text/plain" || name.endsWith(".txt")) {
    const text = await file.text();
    return text.trim().slice(0, MAX_CHARS);
  }

  if (type === "application/pdf" || name.endsWith(".pdf")) {
    const arrayBuffer = await file.arrayBuffer();
    const { extractText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(arrayBuffer));
    const { text } = await extractText(pdf, { mergePages: true });
    return (text ?? "").trim().slice(0, MAX_CHARS);
  }

  if (
    type.includes("openxmlformats") ||
    type === "application/msword" ||
    name.endsWith(".docx") ||
    name.endsWith(".doc")
  ) {
    const arrayBuffer = await file.arrayBuffer();
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ arrayBuffer });
    return (result?.value ?? "").trim().slice(0, MAX_CHARS);
  }

  throw new Error("Unsupported file type. Use PDF, DOCX, or TXT.");
}
