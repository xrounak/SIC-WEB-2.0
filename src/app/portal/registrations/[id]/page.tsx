import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOnboarded } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatDateTime, isPast } from "@/lib/format";
import { addTeamInvites, manageInvite, withdrawRegistration } from "@/lib/actions/events";
import { ActionForm, SubmitButton, TextAreaField } from "@/components/ui/form";
import { Avatar, Card, Meta, PageHeader, StatusBadge } from "@/components/ui/primitives";
import type { SicEvent } from "@/lib/types";

export const metadata: Metadata = { title: "Registration" };

export default async function RegistrationPage({ params }: PageProps<"/portal/registrations/[id]">) {
  const { id } = await params;
  const viewer = await requireOnboarded();
  const supabase = await createClient();
  const { data: reg } = await supabase.from("event_registrations").select("*").eq("id", id).eq("user_id", viewer.id).maybeSingle();
  if (!reg) notFound();

  const { data: eventRow } = await supabase.from("events").select("*").eq("id", reg.event_id).single();
  const event = eventRow as SicEvent;

  let team: { id: string; name: string; status: string; leader_id: string } | null = null;
  let members: Array<{ user_id: string; team_role: string; status: string; profiles: { full_name: string; email: string; avatar_url: string | null } | null }> = [];
  let invites: Array<{ id: string; email: string; status: string; expires_at: string }> = [];
  if (reg.event_team_id) {
    const [{ data: t }, { data: m }, { data: inv }] = await Promise.all([
      supabase.from("event_teams").select("id, name, status, leader_id").eq("id", reg.event_team_id).single(),
      supabase
        .from("event_registrations")
        .select("user_id, team_role, status, profiles(full_name, email, avatar_url)")
        .eq("event_team_id", reg.event_team_id)
        .neq("status", "cancelled"),
      supabase.from("team_invites").select("id, email, status, expires_at").eq("event_team_id", reg.event_team_id).order("created_at"),
    ]);
    team = t;
    members = (m ?? []) as unknown as typeof members;
    invites = (inv ?? []) as typeof invites;
  }

  const isLeader = reg.team_role === "leader";
  const active = reg.status === "registered" && event.status === "published";
  const started = isPast(event.starts_at);
  const canInvite = isLeader && active && team?.status !== "withdrawn" && members.length + invites.filter((i) => i.status === "pending").length < (event.team_max ?? 0);

  return (
    <div className="flex flex-col gap-8">
      <Link href="/portal/registrations" className="text-sm text-muted hover:text-fg">
        ← Registrations
      </Link>
      <PageHeader
        eyebrow="Registration"
        title={event.title}
        actions={event.slug ? <Link href={`/events/${event.slug}`} className="text-sm text-primary">Event page ↗</Link> : undefined}
      />
      <Card className="p-5">
        <Meta
          items={[
            { label: "When", value: formatDateTime(event.starts_at) },
            { label: "Venue", value: event.venue ?? "To be announced" },
            { label: "Your status", value: <StatusBadge status={event.status === "cancelled" ? "cancelled" : reg.status} /> },
            { label: "Registered", value: formatDate(reg.created_at) },
          ]}
        />
      </Card>

      {team && (
        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold">Team {team.name}</h2>
            <StatusBadge status={team.status} />
          </div>
          {team.status === "forming" && (
            <p className="text-sm text-muted">
              The team needs at least {event.team_min} members by {formatDateTime(event.reg_closes_at ?? event.starts_at)}. Teams below the
              minimum are withdrawn automatically when registration closes.
            </p>
          )}
          <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
            {members.map((m) => (
              <li key={m.user_id} className="flex items-center gap-3 p-3">
                <Avatar name={m.profiles?.full_name ?? "?"} src={m.profiles?.avatar_url} size={32} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium">{m.profiles?.full_name}</span>
                  <span className="truncate text-[0.8125rem] text-subtle">{m.profiles?.email}</span>
                </span>
                <span className="font-mono text-[0.75rem] text-muted">{m.team_role}</span>
              </li>
            ))}
            {invites
              .filter((i) => i.status !== "accepted")
              .map((i) => (
                <li key={i.id} className="flex flex-wrap items-center gap-3 p-3">
                  <span className="inline-flex size-8 items-center justify-center rounded-full border border-dashed border-line-strong text-subtle">@</span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm">{i.email}</span>
                    <span className="text-[0.75rem] text-subtle">Invite expires {formatDate(i.expires_at)}</span>
                  </span>
                  <StatusBadge status={i.status} />
                  {isLeader && active && ["pending", "expired", "declined"].includes(i.status) && (
                    <div className="flex gap-1">
                      <ActionForm action={manageInvite} className="gap-0" hideMessages>
                        <input type="hidden" name="invite_id" value={i.id} />
                        <SubmitButton size="sm" variant="ghost" name="intent" value="resend" pendingLabel="…">
                          Resend
                        </SubmitButton>
                      </ActionForm>
                      {i.status === "pending" && (
                        <ActionForm action={manageInvite} className="gap-0" hideMessages>
                          <input type="hidden" name="invite_id" value={i.id} />
                          <SubmitButton size="sm" variant="ghost" name="intent" value="revoke" pendingLabel="…">
                            Cancel
                          </SubmitButton>
                        </ActionForm>
                      )}
                    </div>
                  )}
                </li>
              ))}
          </ul>
          {canInvite && (
            <Card className="p-5">
              <ActionForm action={addTeamInvites}>
                <input type="hidden" name="team_id" value={team.id} />
                <TextAreaField name="emails" label="Invite more teammates" rows={2} placeholder="teammate@gmail.com" hint="One email per line." />
                <SubmitButton variant="secondary" className="self-start" pendingLabel="Sending…">
                  Send invites
                </SubmitButton>
              </ActionForm>
            </Card>
          )}
        </section>
      )}

      {active && !started && (
        <Card className="flex flex-col gap-3 border-danger/30 p-5">
          <p className="font-medium">Can&apos;t make it?</p>
          <p className="text-sm text-muted">
            {isLeader
              ? "Withdrawing as leader withdraws the whole team and cancels pending invites."
              : "Withdrawing frees your seat. You can register again while registration is open."}
          </p>
          <ActionForm action={withdrawRegistration}>
            <input type="hidden" name="registration_id" value={reg.id} />
            <SubmitButton variant="danger" className="self-start" pendingLabel="Withdrawing…">
              {isLeader ? "Withdraw team" : "Withdraw"}
            </SubmitButton>
          </ActionForm>
        </Card>
      )}
    </div>
  );
}
