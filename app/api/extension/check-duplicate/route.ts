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
  const company = url.searchParams.get("company") || "";
  const role = url.searchParams.get("role") || "";

  if (!company || !role) {
    return NextResponse.json({ exists: false }, { headers });
  }

  const existing = await prisma.application.findFirst({
    where: {
      userId: session.user.id,
      company: { equals: company, mode: "insensitive" },
      role: { equals: role, mode: "insensitive" },
    },
    select: {
      id: true,
      status: true,
      createdAt: true,
    },
  });

  return NextResponse.json(
    existing ? { exists: true, id: existing.id, status: existing.status } : { exists: false },
    { headers }
  );
}
