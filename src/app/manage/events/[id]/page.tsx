import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireManager } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getTeams } from "@/lib/data";
import { EVENT_TYPE_LABEL, formatDate, formatDateTime } from "@/lib/format";
import { cancelEvent, publishEvent, reviewEvent } from "@/lib/actions/events";
import { ActionForm, CheckboxField, SubmitButton, TextAreaField } from "@/components/ui/form";
import { buttonClass } from "@/components/ui/button";
import { Badge, Card, Meta, Notice, PageHeader, StatusBadge, Table } from "@/components/ui/primitives";
import { ReviewTimeline } from "@/components/review-timeline";
import type { EventReview, SicEvent } from "@/lib/types";

export const metadata: Metadata = { title: "Event · Manage" };

type RosterRow = {
  id: string;
  status: string;
  team_role: string | null;
  created_at: string;
  event_team_id: string | null;
  profiles: { full_name: string; email: string; phone: string | null; college_name: string | null; branch: string | null; academic_year: number | null } | null;
  event_teams: { name: string; status: string } | null;
};

export default async function ManageEventPage({ params }: PageProps<"/manage/events/[id]">) {
  const { id } = await params;
  const viewer = await requireManager();
  const supabase = await createClient();
  const { data } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const event = data as SicEvent;

  const [{ data: reviews }, { data: roster }, { data: proposer }, teams] = await Promise.all([
    supabase.from("event_reviews").select("*").eq("event_id", id).order("created_at"),
    supabase
      .from("event_registrations")
      .select("id, status, team_role, created_at, event_team_id, profiles(full_name, email, phone, college_name, branch, academic_year), event_teams(name, status)")
      .eq("event_id", id)
      .order("created_at"),
    supabase.from("profiles").select("full_name, email").eq("id", event.created_by).maybeSingle(),
    getTeams(),
  ]);
  const rows = (roster ?? []) as unknown as RosterRow[];
  const active = rows.filter((r) => r.status !== "cancelled");

  const leadsThis = viewer.leadTeamIds.includes(event.owner_team_id);
  const own = event.created_by === viewer.id;
  const canLeadReview = event.status === "pending_review" && (leadsThis || viewer.isExec) && !own;
  const canFinalReview = event.status === "lead_approved" && event.is_major && viewer.isExec && !own;
  const canPublish =
    ((event.status === "lead_approved" && !event.is_major) || event.status === "final_approved") && (leadsThis || viewer.isExec || viewer.isAdmin);
  const canCancel = event.status === "published" && (leadsThis || viewer.isExec || viewer.isAdmin);

  return (
    <div className="flex flex-col gap-8">
      <Link href="/manage/events" className="text-sm text-muted hover:text-fg">
        ← Events
      </Link>
      <PageHeader
        eyebrow={teams.find((t) => t.id === event.owner_team_id)?.name}
        title={event.title}
        actions={
          <div className="flex items-center gap-2">
            {event.is_major && <Badge tone="warning">Major</Badge>}
            <StatusBadge status={event.status} />
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_22.5rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card className="flex flex-col gap-5 p-5">
            <Meta
              items={[
                { label: "Proposed by", value: proposer ? `${proposer.full_name} · ${proposer.email}` : "—" },
                { label: "Type", value: EVENT_TYPE_LABEL[event.event_type] },
                { label: "Starts", value: formatDateTime(event.starts_at) },
                { label: "Ends", value: event.ends_at ? formatDateTime(event.ends_at) : "—" },
                { label: "Venue", value: event.venue ?? "—" },
                { label: "Visibility", value: event.visibility === "public" ? "Everyone" : "Members only" },
                { label: "Format", value: event.participation === "team" ? `Teams of ${event.team_min}–${event.team_max}` : "Individual" },
                { label: "Capacity", value: event.capacity ?? "Unlimited" },
                { label: "Registration opens", value: event.reg_opens_at ? formatDateTime(event.reg_opens_at) : "On publish" },
                { label: "Registration closes", value: formatDateTime(event.reg_closes_at ?? event.starts_at) },
              ]}
            />
            {event.summary && <p className="text-muted">{event.summary}</p>}
            {event.description && <div className="prose-sic border-t border-line pt-4 text-sm">{event.description}</div>}
          </Card>

          <section className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">
                Registrations <span className="font-mono text-sm text-muted tabular">{active.length}{event.capacity ? ` / ${event.capacity}` : ""}</span>
              </h2>
              {rows.length > 0 && (
                <a href={`/manage/events/${id}/registrations.csv`} className={buttonClass("secondary", "sm")}>
                  Export CSV
                </a>
              )}
            </div>
            {rows.length === 0 ? (
              <p className="text-sm text-muted">No registrations yet.</p>
            ) : (
              <Table head={["Name", "Contact", "Team", "Registered", "Status"]}>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <span className="block font-medium">{r.profiles?.full_name}</span>
                      <span className="block text-[0.75rem] text-subtle">
                        {r.profiles?.college_name ?? "Our college"}
                        {r.profiles?.branch ? ` · ${r.profiles.branch}` : ""}
                        {r.profiles?.academic_year ? ` · Y${r.profiles.academic_year}` : ""}
                      </span>
                    </td>
                    <td className="text-[0.8125rem] text-muted">
                      <span className="block">{r.profiles?.email}</span>
                      <span className="block">{r.profiles?.phone}</span>
                    </td>
                    <td className="text-[0.8125rem]">
                      {r.event_teams ? (
                        <>
                          <span className="block">{r.event_teams.name}</span>
                          <span className="block text-subtle">{r.team_role}</span>
                        </>
                      ) : (
                        <span className="text-subtle">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap text-[0.8125rem] text-muted">{formatDate(r.created_at)}</td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                ))}
              </Table>
            )}
          </section>
        </div>

        <aside className="flex flex-col gap-4">
          {(canLeadReview || canFinalReview) && (
            <Card className="p-5">
              <h2 className="mb-1 text-lg font-semibold">{canFinalReview ? "Final approval" : "Lead review"}</h2>
              <p className="mb-4 text-[0.8125rem] text-muted">
                {canFinalReview ? "Approved by the team lead. As VP or President, you make the final call." : "Your decision is sent to the proposer."}
              </p>
              <ActionForm action={reviewEvent}>
                <input type="hidden" name="event_id" value={id} />
                <TextAreaField name="notes" label="Notes for the proposer" required={false} rows={3} hint="Required when requesting changes or rejecting." />
                {canLeadReview && !event.is_major && (
                  <CheckboxField name="mark_major" label="Needs VP / President approval" hint="Flag this as a major event." />
                )}
                <div className="flex flex-wrap gap-2">
                  <SubmitButton name="decision" value="approved" pendingLabel="…">
                    Approve
                  </SubmitButton>
                  <SubmitButton name="decision" value="changes_requested" variant="secondary" pendingLabel="…">
                    Request changes
                  </SubmitButton>
                  <SubmitButton name="decision" value="rejected" variant="danger" pendingLabel="…">
                    Reject
                  </SubmitButton>
                </div>
              </ActionForm>
            </Card>
          )}
          {own && ["pending_review", "lead_approved"].includes(event.status) && (
            <Notice tone="neutral">You proposed this event, so someone else reviews it.</Notice>
          )}
          {event.status === "lead_approved" && event.is_major && !viewer.isExec && (
            <Notice tone="accent" title="Waiting for VP or President">The lead has approved; final approval is pending.</Notice>
          )}
          {canPublish && (
            <Card className="flex flex-col gap-3 p-5">
              <h2 className="text-lg font-semibold">Ready to publish</h2>
              <p className="text-[0.8125rem] text-muted">Publishing makes the event public and opens registration on schedule.</p>
              <ActionForm action={publishEvent}>
                <input type="hidden" name="event_id" value={id} />
                <SubmitButton pendingLabel="Publishing…">Publish event</SubmitButton>
              </ActionForm>
            </Card>
          )}
          {event.status === "published" && event.slug && (
            <Link href={`/events/${event.slug}`} className={buttonClass("secondary")}>
              View public page ↗
            </Link>
          )}
          {canCancel && (
            <Card className="border-danger/30 p-5">
              <h2 className="mb-3 text-lg font-semibold">Cancel event</h2>
              <ActionForm action={cancelEvent}>
                <input type="hidden" name="event_id" value={id} />
                <TextAreaField name="reason" label="Reason" rows={2} hint="Every registrant gets this by email." />
                <SubmitButton variant="danger" pendingLabel="Cancelling…">
                  Cancel event
                </SubmitButton>
              </ActionForm>
            </Card>
          )}
          <Card className="p-5">
            <h2 className="mb-4 text-lg font-semibold">Review history</h2>
            <ReviewTimeline
              emptyText="No decisions yet."
              entries={((reviews ?? []) as EventReview[]).map((r) => ({
                id: r.id,
                label: r.stage === "lead" ? "Lead review" : "Final review",
                decision: r.decision,
                notes: r.notes,
                created_at: r.created_at,
              }))}
            />
          </Card>
        </aside>
      </div>
    </div>
  );
}
