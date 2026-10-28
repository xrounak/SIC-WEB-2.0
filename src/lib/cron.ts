import type { NextRequest } from "next/server";

/** Vercel cron sends `Authorization: Bearer $CRON_SECRET`. Anything else is refused. */
export function isAuthorizedCron(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret) && request.headers.get("authorization") === `Bearer ${secret}`;
}
