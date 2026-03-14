import { NextRequest, NextResponse } from "next/server";
import { parseCareersUrl, tokenToCompanyName, canFetchJobs } from "@/lib/parse-careers-url";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const url = (body.url ?? body.careersUrl ?? "").toString().trim();

  if (!url || url.length < 10) {
    return NextResponse.json(
      { valid: false, error: "Please enter a valid URL" },
      { status: 400 }
    );
  }

  const parsed = parseCareersUrl(url);

  return NextResponse.json({
    valid: true,
    source: parsed.source,
    boardToken: parsed.boardToken,
    company: canFetchJobs(parsed.source)
      ? tokenToCompanyName(parsed.boardToken)
      : undefined,
    canFetchJobs: canFetchJobs(parsed.source),
  });
}
