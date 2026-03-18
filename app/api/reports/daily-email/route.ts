import { NextRequest, NextResponse } from "next/server";
import { sendDailyReportsForNow } from "@/lib/daily-report/sendDailyReports";

export async function POST(req: NextRequest) {
  const secret = process.env.DAILY_REPORT_CRON_SECRET;
  if (secret) {
    const provided = req.headers.get("x-cron-secret");
    if (!provided || provided !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Cron secret not configured" }, { status: 401 });
  }

  const result = await sendDailyReportsForNow();
  return NextResponse.json({ ok: true, ...result });
}

