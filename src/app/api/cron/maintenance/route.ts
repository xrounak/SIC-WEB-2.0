import { NextResponse, type NextRequest } from "next/server";
import { isAuthorizedCron } from "@/lib/cron";
import { createAdminClient } from "@/lib/supabase/admin";

/** Reminds/withdraws incomplete teams, expires invites and completes past events. */
export async function GET(request: NextRequest) {
  if (!isAuthorizedCron(request)) return new NextResponse("Unauthorized", { status: 401 });
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("run_scheduled_maintenance");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ maintenance: data });
}
