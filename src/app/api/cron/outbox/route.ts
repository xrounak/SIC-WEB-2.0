import { NextResponse, type NextRequest } from "next/server";
import { isAuthorizedCron } from "@/lib/cron";
import { flushOutbox } from "@/lib/email/outbox";

export async function GET(request: NextRequest) {
  if (!isAuthorizedCron(request)) return new NextResponse("Unauthorized", { status: 401 });
  const result = await flushOutbox();
  return NextResponse.json(result);
}
