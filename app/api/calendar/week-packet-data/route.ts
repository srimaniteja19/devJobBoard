import { NextResponse } from "next/server";
import { authenticatedAction } from "@/lib/api-auth";
import { getWeekInterviewPacketData } from "@/lib/week-interview-packet";

export async function GET() {
  const { user, unauthorized } = await authenticatedAction();
  if (unauthorized) return unauthorized;

  try {
    const data = await getWeekInterviewPacketData(user.id);
    return NextResponse.json(data);
  } catch (e) {
    console.error("Week packet data error:", e);
    return NextResponse.json({ error: "Failed to load week packet data" }, { status: 500 });
  }
}
