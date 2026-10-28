import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOnboarded } from "@/lib/auth";
import { getEventBySlug } from "@/lib/data";
import { formatDateTime } from "@/lib/format";
import { createTeam, registerIndividual } from "@/lib/actions/events";
import { ActionForm, SubmitButton, TextAreaField, TextField } from "@/components/ui/form";
import { Card, Container, Meta, PageHeader } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Register" };

export default async function RegisterPage({ params }: PageProps<"/events/[slug]/register">) {
  const { slug } = await params;
  const viewer = await requireOnboarded();
  const event = await getEventBySlug(slug);
  if (!event || event.status !== "published") notFound();
  const isTeam = event.participation === "team";

  return (
    <Container className="flex max-w-2xl flex-col gap-8 py-12">
      <Link href={`/events/${slug}`} className="text-sm text-muted hover:text-fg">
        ← {event.title}
      </Link>
      <PageHeader hud
        eyebrow="Registration"
        title={isTeam ? "Register your team" : "Confirm your registration"}
        description={
          isTeam
            ? `You'll be the team leader. Teammates get an email invite and join with their own account. A team needs at least ${event.team_min} people, including you, before registration closes.`
            : "We'll use the details from your profile."
        }
      />

      <Card className="p-5">
        <Meta
          items={[
            { label: "Event", value: event.title },
            { label: "When", value: formatDateTime(event.starts_at) },
            { label: "Registering as", value: `${viewer.profile.full_name} · ${viewer.profile.email}` },
            { label: "Registration closes", value: formatDateTime(event.reg_closes_at ?? event.starts_at) },
          ]}
        />
      </Card>

      {isTeam ? (
        <ActionForm action={createTeam}>
          <input type="hidden" name="event_id" value={event.id} />
          <TextField name="team_name" label="Team name" maxLength={60} placeholder="e.g. Torque Bandits" />
          <TextAreaField
            name="emails"
            label="Teammates' emails"
            required={false}
            rows={3}
            placeholder={"friend1@gmail.com\nfriend2@gmail.com"}
            hint={`Up to ${(event.team_max ?? 2) - 1}, one per line. They must sign in with this exact email to accept. You can add more later.`}
          />
          <SubmitButton size="lg" pendingLabel="Creating team…">
            Create team and send invites
          </SubmitButton>
        </ActionForm>
      ) : (
        <ActionForm action={registerIndividual}>
          <input type="hidden" name="event_id" value={event.id} />
          <input type="hidden" name="slug" value={slug} />
          <SubmitButton size="lg" pendingLabel="Registering…">
            Confirm registration
          </SubmitButton>
        </ActionForm>
      )}
    </Container>
  );
}
