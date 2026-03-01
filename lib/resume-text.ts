import { extractText } from "unpdf";
import mammoth from "mammoth";

const MAX_RESUME_CHARS = 4000;

export async function extractResumeText(url: string): Promise<string> {
  try {
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) return "";

    const arrayBuffer = await res.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    const contentType = res.headers.get("content-type") ?? "";
    const urlLower = url.toLowerCase();

    if (
      contentType.includes("application/pdf") ||
      urlLower.endsWith(".pdf")
    ) {
      const { text } = await extractText(buffer, { mergePages: true });
      return (text ?? "").trim().slice(0, MAX_RESUME_CHARS);
    }

    if (
      contentType.includes("application/vnd.openxmlformats") ||
      contentType.includes("application/msword") ||
      urlLower.endsWith(".docx") ||
      urlLower.endsWith(".doc")
    ) {
      const result = await mammoth.extractRawText({ buffer: Buffer.from(arrayBuffer) });
      return (result?.value ?? "").trim().slice(0, MAX_RESUME_CHARS);
    }

    return "";
  } catch {
    return "";
  }
}
