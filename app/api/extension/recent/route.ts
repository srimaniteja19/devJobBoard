import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { extensionCorsHeaders } from "@/lib/extension-cors";

export async function OPTIONS(req: NextRequest) {
  return NextResponse.json(null, {
    status: 204,
    headers: extensionCorsHeaders(req, "GET, OPTIONS"),
  });
}

export async function GET(req: NextRequest) {
  const headers = extensionCorsHeaders(req, "GET, OPTIONS");
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers });
  }

  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "20", 10), 50);

  const apps = await prisma.application.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      company: true,
      role: true,
      status: true,
      jobUrl: true,
      createdAt: true,
    },
  });

  return NextResponse.json(apps, { headers });
}
