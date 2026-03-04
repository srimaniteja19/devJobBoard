import { NextRequest } from "next/server";

/**
 * CORS headers for Chrome extension API routes.
 * Extension requests use chrome-extension:// origin; we must echo it
 * (not *) for credentials/cookies to work.
 */
export function extensionCorsHeaders(
  req: NextRequest,
  methods: string = "GET, POST, OPTIONS"
) {
  const origin = req.headers.get("origin") || "";
  const allowOrigin =
    origin.startsWith("chrome-extension://") ? origin : "*";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": methods,
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Credentials": "true",
  };
}
