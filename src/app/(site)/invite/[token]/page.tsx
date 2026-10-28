import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getViewer } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { acceptInvite, declineInvite } from "@/lib/actions/events";
import { ActionForm, SubmitButton } from "@/components/ui/form";
import { ButtonLink } from "@/components/ui/button";
import { Card, Container, EmptyState, Eyebrow, Meta, Notice, StatusBadge } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Team invite", robots: { index: false } };

type InvitePreview = {
  status: string;
  email_hint: string;
  expires_at: string;
  team_name: string;
  team_status: string;
  leader_name: string;
  event_title: string;
  event_slug: string | null;
  event_starts_at: string | null;
  event_venue: string | null;
};

export default async function InvitePage({ params }: PageProps<"/invite/[token]">) {
  const { token } = await params;
  let invite: InvitePreview | null = null;
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase.rpc("get_invite", { p_token: token });
    invite = (data as InvitePreview) ?? null;
  }
  const viewer = await getViewer();

  if (!invite) {
    return (
      <Container className="max-w-xl py-16">
        <EmptyState title="This invite link isn't valid" description="Check that you copied the whole link, or ask the team leader to send a new invite." />
      </Container>
    );
  }

  const pending = invite.status === "pending" && invite.team_status !== "withdrawn";

  return (
    <Container className="flex max-w-xl flex-col gap-6 py-16">
      <div className="flex flex-col gap-2">
        <Eyebrow>Team invite</Eyebrow>
        <h1 className="text-3xl font-semibold">
          {invite.leader_name || "A teammate"} invited you to join <span className="text-primary">{invite.team_name}</span>
        </h1>
      </div>

      <Card className="flex flex-col gap-4 p-5">
        <Meta
          items={[
            { label: "Event", value: invite.event_title },
            { label: "When", value: formatDateTime(invite.event_starts_at) },
            { label: "Venue", value: invite.event_venue ?? "To be announced" },
            { label: "Sent to", value: invite.email_hint },
          ]}
        />
        {!pending && (
          <div className="flex items-center gap-2 text-sm text-muted">
            Status: <StatusBadge status={invite.team_status === "withdrawn" ? "withdrawn" : invite.status} />
          </div>
        )}
      </Card>

      {pending &&
        (viewer ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted">
              Signed in as <span className="text-fg">{viewer.profile.email}</span>. The invite only works for the address it was sent to.
            </p>
            <div className="flex flex-wrap gap-3">
              <ActionForm action={acceptInvite}>
                <input type="hidden" name="token" value={token} />
                <SubmitButton size="lg" pendingLabel="Joining…">
                  Accept and join team
                </SubmitButton>
              </ActionForm>
              <ActionForm action={declineInvite}>
                <input type="hidden" name="token" value={token} />
                <SubmitButton size="lg" variant="secondary" pendingLabel="Declining…">
                  Decline
                </SubmitButton>
              </ActionForm>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <ButtonLink href={`/login?next=${encodeURIComponent(`/invite/${token}`)}`} size="lg">
              Sign in to accept
            </ButtonLink>
            <p className="text-[0.8125rem] text-subtle">Use the email address the invite was sent to.</p>
          </div>
        ))}

      {invite.status === "expired" && (
        <Notice tone="warning" title="This invite has expired.">
          Ask the team leader to send it again from their registration page.
        </Notice>
      )}
    </Container>
  );
}
