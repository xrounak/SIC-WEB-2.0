import type { Metadata } from "next";
import Link from "next/link";
import { requireOnboarded } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatDateTime } from "@/lib/format";
import { respondInvite } from "@/lib/actions/events";
import { ActionForm, SubmitButton } from "@/components/ui/form";
import { Avatar, Card, EmptyState, PageHeader, StatusBadge } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Team invites" };

type InviteRow = {
  id: string;
  status: string;
  expires_at: string;
  created_at: string;
  team_name: string;
  team_size: number;
  leader_name: string;
  leader_avatar: string | null;
  event_title: string;
  event_slug: string | null;
  event_starts_at: string | null;
  event_venue: string | null;
  team_min: number | null;
  team_max: number | null;
};

/** Party-style invites: a leader asked you to join their team; accept or decline here. */
export default async function InvitesPage() {
  await requireOnboarded();
  const supabase = await createClient();
  const { data } = await supabase.rpc("my_team_invites");
  const invites = (data ?? []) as InviteRow[];
  const pending = invites.filter((i) => i.status === "pending");
  const past = invites.filter((i) => i.status !== "pending");

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Portal"
        title="Team invites"
        description="When a team leader invites you, it shows up here. Accept to join their team for that event, or decline."
      />

      {pending.length === 0 ? (
        <EmptyState
          title="No invites right now"
          description="Ask your team leader to invite you from their registration page. They can find you by name once you've signed in."
        />
      ) : (
        <ul className="flex flex-col gap-4">
          {pending.map((i) => (
            <li key={i.id}>
              <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-start gap-4">
                  <Avatar name={i.leader_name} src={i.leader_avatar} size={44} />
                  <div className="flex min-w-0 flex-col gap-1">
                    <p className="text-sm text-muted">
                      <span className="font-medium text-fg">{i.leader_name}</span> invited you to join
                    </p>
                    <p className="text-lg font-semibold leading-tight">Team {i.team_name}</p>
                    <p className="text-sm text-muted">
                      {i.event_slug ? (
                        <Link href={`/events/${i.event_slug}`} className="text-primary hover:underline">
                          {i.event_title}
                        </Link>
                      ) : (
                        i.event_title
                      )}
                      {i.event_starts_at && <> · {formatDateTime(i.event_starts_at)}</>}
                      {i.event_venue && <> · {i.event_venue}</>}
                    </p>
                    <p className="font-mono text-[0.75rem] text-subtle">
                      {i.team_size}/{i.team_max ?? "?"} in the team{i.team_min ? ` · needs ${i.team_min}` : ""} · answer by {formatDate(i.expires_at)}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <ActionForm action={respondInvite} className="gap-0" hideMessages>
                    <input type="hidden" name="invite_id" value={i.id} />
                    <SubmitButton name="intent" value="accept" pendingLabel="Joining…">
                      Accept
                    </SubmitButton>
                  </ActionForm>
                  <ActionForm action={respondInvite} className="gap-0" hideMessages>
                    <input type="hidden" name="invite_id" value={i.id} />
                    <SubmitButton name="intent" value="decline" variant="ghost" pendingLabel="…">
                      Decline
                    </SubmitButton>
                  </ActionForm>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {past.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted">Earlier</h2>
          <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
            {past.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
                <span className="min-w-0 flex-1 truncate">
                  Team {i.team_name} · {i.event_title}
                </span>
                <StatusBadge status={i.status} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
