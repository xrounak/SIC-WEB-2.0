import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getViewer } from "@/lib/auth";
import { formatDateTime, isPast, teamTitle } from "@/lib/format";
import { joinTeamByLink } from "@/lib/actions/events";
import { ActionForm, SubmitButton } from "@/components/ui/form";
import { ButtonLink } from "@/components/ui/button";
import { Card, Container, EmptyState, Eyebrow, Meta, Notice } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Join a team", robots: { index: false } };

type Preview = {
  team_name: string;
  team_status: string;
  event_title: string;
  event_slug: string | null;
  starts_at: string | null;
  reg_closes_at: string | null;
  leader_name: string | null;
  members: number;
  team_max: number;
  already_in: boolean;
};

/** A team's shareable join link: anyone signed in can join while the team has room. */
export default async function JoinTeamPage({ params }: PageProps<"/t/[code]">) {
  const { code } = await params;
  let team: Preview | null = null;
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase.rpc("team_join_preview", { p_code: code });
    team = ((data as Preview[] | null) ?? [])[0] ?? null;
  }
  const viewer = await getViewer();

  if (!team) {
    return (
      <Container className="max-w-xl py-16">
        <EmptyState
          title="This join link doesn't work"
          description="The leader may have made a new link. Ask them for the current one."
        />
      </Container>
    );
  }

  const full = team.members >= team.team_max;
  const closed = team.team_status === "withdrawn" || isPast(team.reg_closes_at);
  const name = teamTitle(team.team_name);

  return (
    <Container className="flex max-w-xl flex-col gap-6 py-16">
      <div className="flex flex-col gap-2">
        <Eyebrow>Join a team</Eyebrow>
        <h1 className="text-3xl font-semibold">
          {team.leader_name || "A teammate"} wants you in <span className="text-primary">{name}</span>
        </h1>
      </div>

      <Card className="flex flex-col gap-4 p-5">
        <Meta
          items={[
            { label: "Event", value: team.event_title },
            { label: "When", value: formatDateTime(team.starts_at) },
            { label: "Team", value: `${team.members} of ${team.team_max} people` },
          ]}
        />
      </Card>

      {team.already_in ? (
        <Notice tone="accent" title="You're already registered for this event.">
          See your team in Portal → Registrations.
        </Notice>
      ) : closed ? (
        <Notice tone="warning" title="This team can't take anyone right now.">
          Registration has closed or the team has withdrawn.
        </Notice>
      ) : full ? (
        <Notice tone="warning" title={`${name} is full.`}>
          Ask the leader, or register your own team from the event page.
        </Notice>
      ) : viewer ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted">
            Signed in as <span className="text-fg">{viewer.profile.email}</span>.
          </p>
          <ActionForm action={joinTeamByLink}>
            <input type="hidden" name="code" value={code} />
            <SubmitButton size="lg" pendingLabel="Joining…">
              Join {name}
            </SubmitButton>
          </ActionForm>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <ButtonLink href={`/login?next=${encodeURIComponent(`/t/${code}`)}`} size="lg">
            Sign in to join
          </ButtonLink>
          <p className="text-[0.8125rem] text-subtle">Sign in with Google. You come straight back here to join.</p>
        </div>
      )}
    </Container>
  );
}
