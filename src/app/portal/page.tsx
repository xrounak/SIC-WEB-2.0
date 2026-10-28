import type { Metadata } from "next";
import Link from "next/link";
import { requireOnboarded } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getOpenCycle } from "@/lib/data";
import { formatDateTime, relativeTime } from "@/lib/format";
import { ButtonLink } from "@/components/ui/button";
import { Card, EmptyState, Notice, PageHeader, SectionTitle, StatusBadge } from "@/components/ui/primitives";
import { DateTile } from "@/components/cards";
import { QueryNotice } from "@/components/query-notice";

export const metadata: Metadata = { title: "Portal" };

type RegRow = {
  id: string;
  status: string;
  team_role: string | null;
  events: { title: string; slug: string | null; starts_at: string | null; venue: string | null } | null;
};

export default async function PortalHome({ searchParams }: PageProps<"/portal">) {
  const viewer = await requireOnboarded();
  const supabase = await createClient();
  const now = new Date().toISOString();

  const [{ data: regs }, { data: invites }, { data: apps }, { data: notes }, cycle] = await Promise.all([
    supabase
      .from("event_registrations")
      .select("id, status, team_role, events!inner(title, slug, starts_at, venue)")
      .eq("user_id", viewer.id)
      .eq("status", "registered")
      .gte("events.starts_at", now)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("team_invites").select("id, status, expires_at").eq("email", viewer.profile.email).eq("status", "pending").gte("expires_at", now),
    supabase.from("recruitment_applications").select("id, status").eq("user_id", viewer.id).order("submitted_at", { ascending: false }).limit(1),
    supabase.from("notifications").select("id, title, target_url, created_at, read_at").eq("user_id", viewer.id).order("created_at", { ascending: false }).limit(5),
    getOpenCycle(),
  ]);
  const registrations = (regs ?? []) as unknown as RegRow[];
  const app = apps?.[0];
  const p = viewer.profile;
  const firstName = p.full_name.split(" ")[0] || "there";

  return (
    <div className="flex flex-col gap-8">
      <QueryNotice searchParams={searchParams} />
      <PageHeader
        eyebrow="Portal"
        title={`Hi, ${firstName}`}
        description={viewer.isMember ? "Here's what's happening in the club." : "Your registrations, invites and applications in one place."}
        actions={<ButtonLink href="/events" variant="secondary">Browse events</ButtonLink>}
      />

      {(invites?.length ?? 0) > 0 && (
        <Notice tone="accent" title={`You have ${invites!.length} pending team invite${invites!.length > 1 ? "s" : ""}.`}>
          Open the invite link from your email, or check{" "}
          <Link href="/portal/notifications" className="text-primary underline">
            notifications
          </Link>
          .
        </Notice>
      )}
      {p.student_status === "pending" && (
        <Notice tone="warning" title="Student status: waiting for verification">
          A club lead will confirm your roll number. You can still register for events.
        </Notice>
      )}
      {!viewer.isMember && cycle && !app && p.student_status !== "external" && (
        <Notice tone="accent" title={`${cycle.name} is open.`}>
          <Link href="/join/apply" className="text-primary underline">
            Apply to become a member
          </Link>
          .
        </Notice>
      )}

      <section className="flex flex-col gap-4">
        <SectionTitle
          title="Your upcoming events"
          action={<ButtonLink href="/portal/registrations" variant="ghost" size="sm">All registrations →</ButtonLink>}
        />
        {registrations.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {registrations.map((r) => (
              <Link
                key={r.id}
                href={`/portal/registrations/${r.id}`}
                className="flex items-center gap-4 rounded-xl border border-line bg-surface p-4 transition-colors hover:border-line-strong"
              >
                <DateTile value={r.events?.starts_at ?? null} />
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate font-medium">{r.events?.title}</span>
                  <span className="text-[0.8125rem] text-subtle">
                    {formatDateTime(r.events?.starts_at)}
                    {r.team_role ? ` · Team ${r.team_role}` : ""}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState title="No upcoming registrations" action={<ButtonLink href="/events" size="sm">Find an event</ButtonLink>} />
        )}
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="flex flex-col gap-3 p-5">
          <p className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-subtle">Membership</p>
          <div className="flex items-center gap-2">
            <StatusBadge status={p.member_status} />
            <StatusBadge status={p.student_status} />
          </div>
          {app ? (
            <Link href="/portal/applications" className="text-sm text-muted hover:text-fg">
              Latest application: <StatusBadge status={app.status} />
            </Link>
          ) : (
            <p className="text-sm text-muted">{viewer.isMember ? "You're a member of SIC." : "You haven't applied yet."}</p>
          )}
        </Card>
        <Card className="flex flex-col gap-3 p-5">
          <p className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-subtle">Latest notifications</p>
          {(notes?.length ?? 0) > 0 ? (
            <ul className="flex flex-col gap-2">
              {notes!.map((n) => (
                <li key={n.id} className="flex items-baseline justify-between gap-3 text-sm">
                  <Link href={n.target_url ?? "/portal/notifications"} className={n.read_at ? "truncate text-muted" : "truncate font-medium"}>
                    {n.title}
                  </Link>
                  <span className="shrink-0 text-[0.75rem] text-subtle">{relativeTime(n.created_at)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Nothing yet.</p>
          )}
        </Card>
      </div>

      {viewer.isMember && (
        <section className="flex flex-col gap-4">
          <SectionTitle title="Start something" />
          <div className="grid gap-3 sm:grid-cols-2">
            <Link href="/portal/proposals/new" className="flex flex-col gap-1 rounded-xl border border-line bg-surface p-5 transition-colors hover:border-primary/50">
              <span className="font-medium">Propose an event</span>
              <span className="text-sm text-muted">Workshop, talk, hackathon or competition. Your team lead reviews it.</span>
            </Link>
            <Link href="/portal/projects/new" className="flex flex-col gap-1 rounded-xl border border-line bg-surface p-5 transition-colors hover:border-primary/50">
              <span className="font-medium">Submit a project</span>
              <span className="text-sm text-muted">Show what you built. Contributors confirm their credit.</span>
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
