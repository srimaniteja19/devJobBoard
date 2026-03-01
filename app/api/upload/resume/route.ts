import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { authenticatedAction } from "@/lib/api-auth";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

export async function POST(req: NextRequest) {
  const { user, unauthorized } = await authenticatedAction();
  if (unauthorized) return unauthorized;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file || !file.size) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
    }

    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Use PDF or DOC/DOCX" },
        { status: 400 }
      );
    }

    const ext = file.name.split(".").pop() ?? "pdf";
    const name = `resume-${user.id}-${Date.now()}.${ext}`;

    const blob = await put(name, file, {
      access: "public",
    });

    return NextResponse.json({ url: blob.url });
  } catch (e) {
    console.error("Resume upload error:", e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
