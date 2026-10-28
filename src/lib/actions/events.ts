"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireMember, requireOnboarded, requireViewer } from "@/lib/auth";
import { fromLocalInput } from "@/lib/format";
import { fromRpcError, fromZodError, type ActionState } from "./state";

const id = z.string().uuid();

function emailsFrom(value: FormDataEntryValue | null) {
  return (value?.toString() ?? "")
    .split(/[\s,;]+/)
    .map((e) => e.trim())
    .filter(Boolean);
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export async function registerIndividual(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireOnboarded();
  const eventId = id.parse(formData.get("event_id"));
  const slug = formData.get("slug")?.toString() ?? "";
  const supabase = await createClient();
  const { error } = await supabase.rpc("register_individual", { p_event_id: eventId });
  if (error) return fromRpcError(error);
  revalidatePath(`/events/${slug}`);
  redirect(`/portal/registrations?notice=registered`);
}

export async function createTeam(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireOnboarded();
  const parsed = z
    .object({ event_id: id, team_name: z.string().trim().min(2, "Give your team a name.").max(60) })
    .safeParse({ event_id: formData.get("event_id"), team_name: formData.get("team_name") });
  if (!parsed.success) return fromZodError(parsed.error, formData);

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_event_team", {
    p_event_id: parsed.data.event_id,
    p_team_name: parsed.data.team_name,
    p_invite_emails: emailsFrom(formData.get("emails")),
  });
  if (error) return fromRpcError(error, formData);
  redirect(`/portal/registrations?notice=team-created`);
}

export async function acceptInvite(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireOnboarded();
  const token = formData.get("token")?.toString() ?? "";
  const supabase = await createClient();
  const { error } = await supabase.rpc("accept_invite", { p_token: token });
  if (error) return fromRpcError(error);
  redirect(`/portal/registrations?notice=joined`);
}

export async function declineInvite(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireViewer();
  const token = formData.get("token")?.toString() ?? "";
  const supabase = await createClient();
  const { error } = await supabase.rpc("decline_invite", { p_token: token });
  if (error) return fromRpcError(error);
  return { ok: true, message: "Invite declined. The team leader has been told." };
}

export async function withdrawRegistration(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireViewer();
  const registrationId = id.parse(formData.get("registration_id"));
  const supabase = await createClient();
  const { error } = await supabase.rpc("withdraw_registration", { p_registration_id: registrationId });
  if (error) return fromRpcError(error);
  revalidatePath("/portal/registrations");
  redirect("/portal/registrations?notice=withdrawn");
}

export async function addTeamInvites(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireViewer();
  const teamId = id.parse(formData.get("team_id"));
  const emails = emailsFrom(formData.get("emails"));
  if (emails.length === 0) return { fieldErrors: { emails: "Enter at least one email." }, error: "Check the highlighted fields." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("add_team_invites", { p_team_id: teamId, p_emails: emails });
  if (error) return fromRpcError(error, formData);
  revalidatePath("/portal/registrations", "layout");
  return { ok: true, message: emails.length === 1 ? "Invite sent." : `${emails.length} invites sent.` };
}

export async function manageInvite(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireViewer();
  const inviteId = id.parse(formData.get("invite_id"));
  const intent = formData.get("intent") === "resend" ? "resend_team_invite" : "revoke_team_invite";
  const supabase = await createClient();
  const { error } = await supabase.rpc(intent, { p_invite_id: inviteId });
  if (error) return fromRpcError(error);
  revalidatePath("/portal/registrations", "layout");
  return { ok: true, message: intent === "resend_team_invite" ? "Invite sent again." : "Invite cancelled." };
}

// ---------------------------------------------------------------------------
// Proposals
// ---------------------------------------------------------------------------

const eventSchema = z
  .object({
    title: z.string().trim().min(3, "Use at least 3 characters.").max(140),
    summary: z.string().trim().min(10, "Write a one-line summary.").max(300),
    description: z.string().trim().min(30, "Describe the event in a few sentences.").max(20000),
    event_type: z.enum(["workshop", "hackathon", "competition", "seminar", "external", "meeting"]),
    visibility: z.enum(["public", "members"]),
    owner_team_id: id,
    domain_id: id.optional(),
    venue: z.string().trim().min(2, "Where is it happening?").max(200),
    starts_at: z.string().min(1, "Choose a start time."),
    ends_at: z.string().optional(),
    reg_opens_at: z.string().optional(),
    reg_closes_at: z.string().optional(),
    capacity: z.coerce.number().int().positive("Must be more than zero.").optional(),
    participation: z.enum(["individual", "team"]),
    team_min: z.coerce.number().int().min(1).max(10).optional(),
    team_max: z.coerce.number().int().min(2).max(10).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.participation === "team") {
      if (!v.team_min) ctx.addIssue({ code: "custom", path: ["team_min"], message: "Set a minimum." });
      if (!v.team_max) ctx.addIssue({ code: "custom", path: ["team_max"], message: "Set a maximum." });
      if (v.team_min && v.team_max && v.team_min > v.team_max)
        ctx.addIssue({ code: "custom", path: ["team_max"], message: "Must be at least the minimum." });
    }
  });

function readEventForm(formData: FormData) {
  const raw = Object.fromEntries(
    [...formData.entries()].filter(([k, v]) => typeof v === "string" && v !== "" && !k.startsWith("$")),
  );
  return eventSchema.safeParse(raw);
}

/** Creates or updates a draft. intent=submit also sends it for review. */
export async function saveEvent(_: ActionState, formData: FormData): Promise<ActionState> {
  const viewer = await requireMember();
  const parsed = readEventForm(formData);
  if (!parsed.success) return fromZodError(parsed.error, formData);
  const v = parsed.data;
  const team = v.participation === "team";
  const row = {
    title: v.title,
    summary: v.summary,
    description: v.description,
    event_type: v.event_type,
    visibility: v.visibility,
    owner_team_id: v.owner_team_id,
    domain_id: v.domain_id ?? null,
    venue: v.venue,
    starts_at: fromLocalInput(v.starts_at),
    ends_at: fromLocalInput(v.ends_at),
    reg_opens_at: fromLocalInput(v.reg_opens_at),
    reg_closes_at: fromLocalInput(v.reg_closes_at),
    capacity: v.capacity ?? null,
    participation: v.participation,
    team_min: team ? v.team_min : null,
    team_max: team ? v.team_max : null,
  };

  const supabase = await createClient();
  let eventId = formData.get("event_id")?.toString();
  if (eventId) {
    const { error } = await supabase.from("events").update(row).eq("id", eventId);
    if (error) return { error: "Couldn't save. This proposal may no longer be editable.", values: Object.fromEntries([...formData.entries()].map(([k, v]) => [k, String(v)])) };
  } else {
    const { data, error } = await supabase
      .from("events")
      .insert({ ...row, created_by: viewer.id })
      .select("id")
      .single();
    if (error || !data) return { error: "Couldn't save the draft. Check the fields and try again." };
    eventId = data.id as string;
  }

  if (formData.get("intent") === "submit") {
    const { error } = await supabase.rpc("submit_event", { p_event_id: eventId });
    if (error) {
      revalidatePath("/portal/proposals");
      return fromRpcError(error, formData);
    }
  }
  revalidatePath("/portal/proposals");
  redirect(`/portal/proposals/${eventId}?notice=${formData.get("intent") === "submit" ? "submitted" : "saved"}`);
}

export async function submitEvent(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireMember();
  const eventId = id.parse(formData.get("event_id"));
  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_event", { p_event_id: eventId });
  if (error) return fromRpcError(error);
  revalidatePath(`/portal/proposals/${eventId}`);
  return { ok: true, message: "Sent for review." };
}

export async function deleteDraftEvent(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireMember();
  const eventId = id.parse(formData.get("event_id"));
  const supabase = await createClient();
  const { error } = await supabase.from("events").delete().eq("id", eventId).eq("status", "draft");
  if (error) return { error: "Only drafts can be deleted." };
  redirect("/portal/proposals?notice=deleted");
}

// ---------------------------------------------------------------------------
// Review and publishing (manage)
// ---------------------------------------------------------------------------

export async function reviewEvent(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireOnboarded();
  const parsed = z
    .object({
      event_id: id,
      decision: z.enum(["approved", "changes_requested", "rejected"]),
      notes: z.string().trim().max(4000).optional(),
      mark_major: z.literal("on").optional(),
    })
    .safeParse({
      event_id: formData.get("event_id"),
      decision: formData.get("decision"),
      notes: formData.get("notes") || undefined,
      mark_major: formData.get("mark_major") || undefined,
    });
  if (!parsed.success) return fromZodError(parsed.error, formData);
  const supabase = await createClient();
  const { error } = await supabase.rpc("review_event", {
    p_event_id: parsed.data.event_id,
    p_decision: parsed.data.decision,
    p_notes: parsed.data.notes ?? null,
    p_mark_major: Boolean(parsed.data.mark_major),
  });
  if (error) return fromRpcError(error, formData);
  revalidatePath(`/manage/events/${parsed.data.event_id}`);
  revalidatePath("/manage/events");
  return { ok: true, message: "Decision recorded. The proposer has been notified." };
}

export async function publishEvent(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireOnboarded();
  const eventId = id.parse(formData.get("event_id"));
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("publish_event", { p_event_id: eventId });
  if (error) return fromRpcError(error);
  revalidatePath("/events");
  revalidatePath(`/manage/events/${eventId}`);
  return { ok: true, message: `Published at /events/${data}` };
}

export async function cancelEvent(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireOnboarded();
  const eventId = id.parse(formData.get("event_id"));
  const reason = formData.get("reason")?.toString().trim() ?? "";
  if (reason.length < 5) return { error: "Add a reason. Registrants will see it.", fieldErrors: { reason: "Add a reason." } };
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_event", { p_event_id: eventId, p_reason: reason });
  if (error) return fromRpcError(error, formData);
  revalidatePath("/events");
  revalidatePath(`/manage/events/${eventId}`);
  return { ok: true, message: "Event cancelled. Registrants are being emailed." };
}
