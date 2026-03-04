import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { extensionCorsHeaders } from "@/lib/extension-cors";

export async function OPTIONS(req: NextRequest) {
  return NextResponse.json(null, {
    status: 204,
    headers: extensionCorsHeaders(req, "GET, OPTIONS"),
  });
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { user: null },
      { status: 200, headers: extensionCorsHeaders(req, "GET, OPTIONS") }
    );
  }

  return NextResponse.json(
    {
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      },
    },
    { headers: extensionCorsHeaders(req, "GET, OPTIONS") }
  );
}
