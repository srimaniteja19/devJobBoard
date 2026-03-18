import { NextRequest, NextResponse } from "next/server";
import { getCalendarItems } from "@/lib/applications";
import { authenticatedAction } from "@/lib/api-auth";

function escapeIcs(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function formatIcsDate(d: Date): string {
  // RFC5545 requires either floating/local time or UTC time (ending with `Z`).
  // We always export UTC timestamps here.
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export async function GET(req: NextRequest) {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  const protocol = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const baseUrl = host ? `${protocol}://${host}` : (process.env.NEXTAUTH_URL || "");
  const { user, unauthorized } = await authenticatedAction();
  if (unauthorized) return unauthorized;

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 6, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 12, 31);

  try {
    const items = await getCalendarItems(user.id, start, end);

    const lines: string[] = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//JobTracker//Calendar//EN",
      "CALSCALE:GREGORIAN",
    ];

    for (const item of items) {
      const startDate =
        item.startAt !== undefined ? new Date(item.startAt) : (() => {
          const [y, m, d] = item.date.split("-").map(Number);
          return new Date(y, m - 1, d, 9, 0, 0, 0);
        })();
      const endDate =
        item.endAt !== undefined ? new Date(item.endAt) : (() => {
          const [y, m, d] = item.date.split("-").map(Number);
          return new Date(y, m - 1, d, 10, 0, 0, 0);
        })();

      lines.push("BEGIN:VEVENT");
      lines.push(`UID:${item.id}@jobtracker`);
      lines.push(`DTSTAMP:${formatIcsDate(new Date())}`);
      lines.push(`DTSTART:${formatIcsDate(startDate)}`);
      lines.push(`DTEND:${formatIcsDate(endDate)}`);
      lines.push(`SUMMARY:${escapeIcs(item.title)}`);
      if (item.subtitle) {
        lines.push(`DESCRIPTION:${escapeIcs(item.subtitle)}`);
      }
      lines.push(`URL:${baseUrl}/applications/${item.applicationId}`);
      lines.push("END:VEVENT");
    }

    lines.push("END:VCALENDAR");
    const ics = lines.join("\r\n");

    return new NextResponse(ics, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'attachment; filename="jobtracker-calendar.ics"',
      },
    });
  } catch (e) {
    console.error("ICS export error:", e);
    return NextResponse.json({ error: "Failed to export" }, { status: 500 });
  }
}
