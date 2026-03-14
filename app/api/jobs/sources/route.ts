import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticatedAction } from "@/lib/api-auth";
import { parseCareersUrl, tokenToCompanyName, canFetchJobs } from "@/lib/parse-careers-url";

export async function GET() {
  const { user, unauthorized } = await authenticatedAction();
  if (unauthorized) return unauthorized;

  const sources = await prisma.userJobSource.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ sources });
}

export async function POST(req: NextRequest) {
  const { user, unauthorized } = await authenticatedAction();
  if (unauthorized) return unauthorized;

  const body = await req.json().catch(() => ({}));
  const url = (body.url ?? body.careersUrl ?? "").toString().trim();
  const company = (body.company ?? "").toString().trim();

  if (!url) {
    return NextResponse.json(
      { error: "Careers page URL is required" },
      { status: 400 }
    );
  }

  const parsed = parseCareersUrl(url);

  // Custom URLs require company name (we can't infer it)
  if (parsed.source === "custom") {
    if (!company.trim()) {
      return NextResponse.json(
        { error: "Company name is required for custom careers URLs" },
        { status: 400 }
      );
    }
    if (parsed.boardToken.length < 10) {
      return NextResponse.json(
        { error: "Please enter a valid careers page URL" },
        { status: 400 }
      );
    }
  }

  const displayCompany =
    company.trim() || (canFetchJobs(parsed.source) ? tokenToCompanyName(parsed.boardToken) : "");

  try {
    const existing = await prisma.userJobSource.findFirst({
      where: {
        userId: user.id,
        source: parsed.source,
        boardToken: parsed.boardToken,
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: "This careers page is already added", source: existing },
        { status: 409 }
      );
    }

    const source = await prisma.userJobSource.create({
      data: {
        userId: user.id,
        company: displayCompany,
        source: parsed.source,
        boardToken: parsed.boardToken,
        careersUrl: url,
      },
    });
    return NextResponse.json({ source });
  } catch (e) {
    console.error("Add job source error:", e);
    return NextResponse.json(
      { error: "Failed to add careers page" },
      { status: 500 }
    );
  }
}
