import type { Metadata } from "next";
import Link from "next/link";
import { requireOnboarded } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime, isPast } from "@/lib/format";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui/primitives";
import { DateTile } from "@/components/cards";
import { QueryNotice } from "@/components/query-notice";

export const metadata: Metadata = { title: "Registrations" };

type Row = {
  id: string;
  status: string;
  team_role: string | null;
  events: { title: string; slug: string | null; starts_at: string | null; venue: string | null; status: string } | null;
  event_teams: { name: string; status: string } | null;
};

export default async function RegistrationsPage({ searchParams }: PageProps<"/portal/registrations">) {
  const viewer = await requireOnboarded();
  const supabase = await createClient();
  const { data } = await supabase
    .from("event_registrations")
    .select("id, status, team_role, events(title, slug, starts_at, venue, status), event_teams(name, status)")
    .eq("user_id", viewer.id)
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as unknown as Row[];
  const upcoming = rows.filter((r) => r.events?.starts_at && !isPast(r.events.starts_at));
  const past = rows.filter((r) => !upcoming.includes(r));

  return (
    <div className="flex flex-col gap-8">
      <QueryNotice searchParams={searchParams} />
      <PageHeader title="Registrations" description="Events you've signed up for, alone or with a team." />
      {rows.length === 0 && <EmptyState title="No registrations yet" action={<ButtonLink href="/events" size="sm">Browse events</ButtonLink>} />}
      {[
        { title: "Upcoming", list: upcoming },
        { title: "Past", list: past },
      ].map(
        (group) =>
          group.list.length > 0 && (
            <section key={group.title} className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold">{group.title}</h2>
              <ul className="flex flex-col gap-2">
                {group.list.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`/portal/registrations/${r.id}`}
                      className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4 transition-colors hover:border-line-strong sm:flex-row sm:items-center"
                    >
                      <DateTile value={r.events?.starts_at ?? null} />
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="truncate font-medium">{r.events?.title}</span>
                        <span className="text-[0.8125rem] text-subtle">
                          {formatDateTime(r.events?.starts_at)}
                          {r.events?.venue ? ` · ${r.events.venue}` : ""}
                        </span>
                        {r.event_teams && (
                          <span className="text-[0.8125rem] text-muted">
                            Team {r.event_teams.name} · {r.team_role}
                          </span>
                        )}
                      </span>
                      <span className="flex gap-2">
                        {r.event_teams && <StatusBadge status={r.event_teams.status} />}
                        <StatusBadge status={r.events?.status === "cancelled" ? "cancelled" : r.status} />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ),
      )}
    </div>
  );
}
