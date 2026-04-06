import type { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticatedAction } from "@/lib/api-auth";
import { companySnippetCreateSchema } from "@/lib/validations/company-snippet";

export async function GET(req: NextRequest) {
  const { user, unauthorized } = await authenticatedAction();
  if (unauthorized) return unauthorized;

  const company = req.nextUrl.searchParams.get("company")?.trim();
  const q = req.nextUrl.searchParams.get("q")?.trim();

  const where: Prisma.CompanyInterviewSnippetWhereInput = {
    userId: user.id,
  };

  if (company) {
    where.company = { equals: company, mode: "insensitive" };
  }
  if (q) {
    where.content = { contains: q, mode: "insensitive" };
  }

  const rows = await prisma.companyInterviewSnippet.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      company: true,
      content: true,
      source: true,
      applicationId: true,
      createdAt: true,
    },
  });

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { user, unauthorized } = await authenticatedAction();
  if (unauthorized) return unauthorized;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = companySnippetCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { company, content, source, applicationId } = parsed.data;

  if (applicationId) {
    const app = await prisma.application.findFirst({
      where: { id: applicationId, userId: user.id },
      select: { id: true },
    });
    if (!app) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }
  }

  const row = await prisma.companyInterviewSnippet.create({
    data: {
      userId: user.id,
      company,
      content,
      source: source ?? "manual",
      applicationId: applicationId ?? null,
    },
    select: {
      id: true,
      company: true,
      content: true,
      source: true,
      applicationId: true,
      createdAt: true,
    },
  });

  return NextResponse.json(row);
}
