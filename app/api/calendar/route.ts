import { NextRequest, NextResponse } from "next/server";
import { getCalendarItems } from "@/lib/applications";
import { authenticatedAction } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const { user, unauthorized } = await authenticatedAction();
  if (unauthorized) return unauthorized;

  const startParam = req.nextUrl.searchParams.get("start");
  const endParam = req.nextUrl.searchParams.get("end");

  if (!startParam || !endParam) {
    return NextResponse.json(
      { error: "start and end query params required (YYYY-MM-DD)" },
      { status: 400 }
    );
  }

  const start = new Date(startParam);
  const end = new Date(endParam);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
  }

  try {
    const items = await getCalendarItems(user.id, start, end);
    return NextResponse.json(items);
  } catch (e) {
    console.error("Calendar fetch error:", e);
    return NextResponse.json(
      { error: "Failed to load calendar" },
      { status: 500 }
    );
  }
}
