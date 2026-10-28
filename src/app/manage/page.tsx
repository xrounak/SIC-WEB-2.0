import type { Metadata } from "next";
import Link from "next/link";
import { requireManager } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { relativeTime } from "@/lib/format";
import { Card, EmptyState, PageHeader, StatusBadge } from "@/components/ui/primitives";
import { QueryNotice } from "@/components/query-notice";

export const metadata: Metadata = { title: "Manage" };

type Item = { href: string; title: string; status: string; when: string; kind: string };

export default async function ManageInbox({ searchParams }: PageProps<"/manage">) {
  const viewer = await requireManager();
  const supabase = await createClient();

  // RLS limits each query to what this person can see; the filters pick what needs them.
  const [events, projects, apps, students] = await Promise.all([
    supabase
      .from("events")
      .select("id, title, status, is_major, owner_team_id, created_by, updated_at")
      .in("status", ["pending_review", "lead_approved", "final_approved"])
      .neq("created_by", viewer.id)
      .order("updated_at"),
    supabase
      .from("projects")
      .select("id, title, status, owner_team_id, created_by, updated_at")
      .in("status", ["submitted", "in_review"])
      .neq("created_by", viewer.id)
      .order("updated_at"),
    supabase
      .from("recruitment_applications")
      .select("id, status, updated_at, user_id")
      .in("status", ["submitted", "screening", "shortlisted", "interview"])
      .neq("user_id", viewer.id)
      .order("updated_at"),
    supabase.from("profiles").select("id, full_name, updated_at").eq("student_status", "pending").neq("id", viewer.id).limit(50),
  ]);

  const leads = new Set(viewer.leadTeamIds);
  const eventItems: Item[] = (events.data ?? [])
    .filter((e) => {
      if (e.status === "pending_review") return viewer.isExec || leads.has(e.owner_team_id);
      if (e.status === "lead_approved") return e.is_major ? viewer.isExec : viewer.isExec || leads.has(e.owner_team_id);
      return viewer.isExec || leads.has(e.owner_team_id);
    })
    .map((e) => ({
      href: `/manage/events/${e.id}`,
      title: e.title,
      status: e.status,
      when: e.updated_at,
      kind: e.status === "pending_review" ? "Review event" : e.status === "lead_approved" && e.is_major ? "Final approval" : "Ready to publish",
    }));
  const projectItems: Item[] = (projects.data ?? [])
    .filter((p) => viewer.isExec || viewer.isAdmin || leads.has(p.owner_team_id))
    .map((p) => ({ href: `/manage/projects/${p.id}`, title: p.title, status: p.status, when: p.updated_at, kind: "Review project" }));
  const appItems: Item[] = (apps.data ?? []).map((a) => ({
    href: `/manage/recruitment/${a.id}`,
    title: "Application",
    status: a.status,
    when: a.updated_at,
    kind: "Recruitment",
  }));
  const verifyItems: Item[] = (students.data ?? []).map((s) => ({
    href: `/manage/members?tab=verify`,
    title: s.full_name || "New student",
    status: "pending",
    when: s.updated_at,
    kind: "Verify student",
  }));

  const groups = [
    { title: "Events", items: eventItems },
    { title: "Projects", items: projectItems },
    { title: "Recruitment", items: appItems },
    { title: "Student verification", items: verifyItems },
  ];
  const total = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <div className="flex flex-col gap-8">
      <QueryNotice searchParams={searchParams} />
      <PageHeader eyebrow="Manage" title="Inbox" description={total ? `${total} item${total > 1 ? "s" : ""} waiting on you.` : "Nothing waiting on you."} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {groups.map((g) => (
          <Card key={g.title} className="flex flex-col gap-1 p-4">
            <span className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-subtle">{g.title}</span>
            <span className="font-display text-3xl font-semibold tabular">{g.items.length}</span>
          </Card>
        ))}
      </div>

      {total === 0 ? (
        <EmptyState title="All clear" description="New proposals, projects, applications and verifications will show up here." />
      ) : (
        groups
          .filter((g) => g.items.length > 0)
          .map((g) => (
            <section key={g.title} className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold">{g.title}</h2>
              <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
                {g.items.map((i, idx) => (
                  <li key={`${i.href}-${idx}`}>
                    <Link href={i.href} className="flex flex-wrap items-center gap-3 p-4 transition-colors hover:bg-surface-2">
                      <span className="w-32 shrink-0 font-mono text-[0.75rem] text-primary">{i.kind}</span>
                      <span className="min-w-0 flex-1 truncate font-medium">{i.title}</span>
                      <StatusBadge status={i.status} />
                      <span className="text-[0.75rem] text-subtle">{relativeTime(i.when)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))
      )}
    </div>
  );
}
