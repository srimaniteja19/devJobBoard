import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/db";
import { authenticatedAction } from "@/lib/api-auth";
import { extractResumeText } from "@/lib/resume-text";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, unauthorized } = await authenticatedAction();
  if (unauthorized) return unauthorized;

  if (!BLOB_TOKEN) {
    return NextResponse.json(
      { error: "Resume upload not configured. Add BLOB_READ_WRITE_TOKEN." },
      { status: 503 }
    );
  }

  const app = await prisma.application.findFirst({
    where: { id: params.id, userId: user.id },
  });
  if (!app) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file || !file.size) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
    }

    const type = file.type?.toLowerCase();
    const name = file.name?.toLowerCase() ?? "";
    const isPdf =
      type === "application/pdf" || name.endsWith(".pdf");
    const isDocx =
      type.includes("openxmlformats") ||
      type === "application/msword" ||
      name.endsWith(".docx") ||
      name.endsWith(".doc");
    const isTxt =
      type === "text/plain" || name.endsWith(".txt");

    if (!isPdf && !isDocx && !isTxt) {
      return NextResponse.json(
        { error: "Invalid file type. Use PDF, DOCX, or TXT." },
        { status: 400 }
      );
    }

    const ext = file.name.split(".").pop() ?? "pdf";
    const blobName = `resume-${user.id}-${params.id}-${Date.now()}.${ext}`;
    const blob = await put(blobName, file, { access: "public" });

    let resumeText: string | null = null;
    try {
      if (isTxt) {
        const text = await file.text();
        resumeText = text.trim().slice(0, 10000);
      } else {
        resumeText = await extractResumeText(blob.url);
      }
    } catch (extractErr) {
      console.warn("Resume text extraction failed:", extractErr);
    }

    await prisma.application.update({
      where: { id: params.id },
      data: {
        resumeFileUrl: blob.url,
        resumeFileName: file.name,
        resumeText: resumeText ?? null,
        resumeUploadedAt: new Date(),
      },
    });

    return NextResponse.json({
      url: blob.url,
      fileName: file.name,
      hasText: !!resumeText,
    });
  } catch (e) {
    console.error("Application resume upload error:", e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
