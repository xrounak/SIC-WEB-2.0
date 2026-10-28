import { NextResponse, type NextRequest } from "next/server";
import { getViewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function csvCell(value: unknown) {
  const s = value == null ? "" : String(value);
  // Neutralise spreadsheet formulas and quote everything.
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return `"${safe.replaceAll('"', '""')}"`;
}

/** Roster export. RLS limits rows to events the requester manages. */
export async function GET(_: NextRequest, ctx: RouteContext<"/manage/events/[id]/registrations.csv">) {
  const { id } = await ctx.params;
  const viewer = await getViewer();
  if (!viewer?.canManage) return new NextResponse("Not allowed", { status: 403 });

  const supabase = await createClient();
  const [{ data: event }, { data }] = await Promise.all([
    supabase.from("events").select("slug, title").eq("id", id).maybeSingle(),
    supabase
      .from("event_registrations")
      .select("status, team_role, created_at, profiles(full_name, email, phone, college_name, branch, academic_year, roll_number), event_teams(name, status)")
      .eq("event_id", id)
      .order("created_at"),
  ]);
  if (!event) return new NextResponse("Not found", { status: 404 });

  const header = ["Name", "Email", "Phone", "College", "Branch", "Year", "Roll number", "Team", "Team role", "Team status", "Status", "Registered at"];
  const lines = (data ?? []).map((r) => {
    const p = r.profiles as unknown as Record<string, string | number | null> | null;
    const t = r.event_teams as unknown as { name: string; status: string } | null;
    return [p?.full_name, p?.email, p?.phone, p?.college_name ?? "Our college", p?.branch, p?.academic_year, p?.roll_number, t?.name, r.team_role, t?.status, r.status, r.created_at]
      .map(csvCell)
      .join(",");
  });
  const body = [header.map(csvCell).join(","), ...lines].join("\r\n");

  return new NextResponse(body, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${event.slug ?? "event"}-registrations.csv"`,
      "cache-control": "no-store",
    },
  });
}
