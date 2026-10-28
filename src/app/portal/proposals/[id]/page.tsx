import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getDomains, getTeams } from "@/lib/data";
import { EVENT_TYPE_LABEL, formatDateTime } from "@/lib/format";
import { deleteDraftEvent } from "@/lib/actions/events";
import { EventForm } from "@/components/forms/event-form";
import { ActionForm, SubmitButton } from "@/components/ui/form";
import { Card, Meta, Notice, PageHeader, StatusBadge } from "@/components/ui/primitives";
import { ReviewTimeline } from "@/components/review-timeline";
import { QueryNotice } from "@/components/query-notice";
import type { EventReview, SicEvent } from "@/lib/types";

export const metadata: Metadata = { title: "Proposal" };

export default async function ProposalPage({ params, searchParams }: PageProps<"/portal/proposals/[id]">) {
  const { id } = await params;
  const viewer = await requireMember();
  const supabase = await createClient();
  const { data } = await supabase.from("events").select("*").eq("id", id).eq("created_by", viewer.id).maybeSingle();
  if (!data) notFound();
  const event = data as SicEvent;
  const [{ data: reviews }, teams, domains] = await Promise.all([
    supabase.from("event_reviews").select("*").eq("event_id", id).order("created_at"),
    getTeams(),
    getDomains(),
  ]);
  const editable = ["draft", "changes_requested"].includes(event.status);
  const latestNotes = (reviews as EventReview[] | null)?.findLast((r) => r.decision !== "approved")?.notes;

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <QueryNotice searchParams={searchParams} />
      <Link href="/portal/proposals" className="text-sm text-muted hover:text-fg">
        ← Proposals
      </Link>
      <PageHeader
        title={event.title}
        actions={<StatusBadge status={event.status} />}
        description={event.is_major ? "Major event: needs lead approval, then VP or President approval." : "Needs approval from the organising team's lead."}
      />

      {event.status === "changes_requested" && latestNotes && (
        <Notice tone="warning" title="Changes requested">
          <span className="prose-sic">{latestNotes}</span>
        </Notice>
      )}
      {event.status === "published" && event.slug && (
        <Notice tone="success" title="This event is live.">
          <Link href={`/events/${event.slug}`} className="text-primary underline">
            View the public page
          </Link>
        </Notice>
      )}

      <Card className="p-5">
        <h2 className="mb-4 text-lg font-semibold">Review history</h2>
        <ReviewTimeline
          emptyText={event.status === "draft" ? "Not submitted yet." : "Waiting for the first review."}
          entries={((reviews ?? []) as EventReview[]).map((r) => ({
            id: r.id,
            label: r.stage === "lead" ? "Team lead review" : "Final review",
            decision: r.decision,
            notes: r.notes,
            created_at: r.created_at,
          }))}
        />
      </Card>

      {editable ? (
        <>
          <EventForm event={event} teams={teams} domains={domains} />
          {event.status === "draft" && (
            <ActionForm action={deleteDraftEvent}>
              <input type="hidden" name="event_id" value={event.id} />
              <SubmitButton variant="ghost" size="sm" className="self-start text-danger" pendingLabel="Deleting…">
                Delete draft
              </SubmitButton>
            </ActionForm>
          )}
        </>
      ) : (
        <Card className="p-5">
          <Meta
            items={[
              { label: "Type", value: EVENT_TYPE_LABEL[event.event_type] },
              { label: "Starts", value: formatDateTime(event.starts_at) },
              { label: "Venue", value: event.venue ?? "—" },
              { label: "Format", value: event.participation === "team" ? `Teams of ${event.team_min}–${event.team_max}` : "Individual" },
            ]}
          />
        </Card>
      )}
    </div>
  );
}
