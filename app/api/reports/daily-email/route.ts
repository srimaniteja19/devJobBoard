import { NextRequest, NextResponse } from "next/server";
import { sendDailyReportsForNow } from "@/lib/daily-report/sendDailyReports";

async function handleCronRequest(req: NextRequest) {
  // Vercel automatically includes an `Authorization: Bearer <CRON_SECRET>` header for cron jobs.
  // We also support a legacy `x-cron-secret` / `DAILY_REPORT_CRON_SECRET` mode.
  const vercelCronSecret = process.env.CRON_SECRET;
  const dailyReportSecret = process.env.DAILY_REPORT_CRON_SECRET;

  const authHeader = req.headers.get("authorization"); // Bearer <secret>
  const providedBearer =
    authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;
  const providedX = req.headers.get("x-cron-secret");

  const secret = vercelCronSecret ?? dailyReportSecret;
  if (secret) {
    const provided = vercelCronSecret
      ? providedBearer
      : providedX ?? providedBearer;
    if (!provided || provided !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 401 });
  }

  const result = await sendDailyReportsForNow();
  return NextResponse.json({ ok: true, ...result });
}

// Vercel cron jobs invoke this endpoint as `GET` by default.
export async function GET(req: NextRequest) {
  return handleCronRequest(req);
}

export async function POST(req: NextRequest) {
  return handleCronRequest(req);
}

