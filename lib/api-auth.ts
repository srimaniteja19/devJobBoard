import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function authenticatedAction() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      user: null,
      unauthorized: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      ),
    } as const;
  }

  return { user: session.user, unauthorized: null } as const;
}
