"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireManager, requireOnboarded } from "@/lib/auth";
import { fromLocalInput } from "@/lib/format";
import { fromRpcError, fromZodError, type ActionState } from "./state";

const id = z.string().uuid();

export async function submitApplication(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireOnboarded();
  const parsed = z
    .object({
      cycle_id: id,
      domains: z.array(id).min(1, "Pick at least one domain.").max(5, "Pick up to five."),
      teams: z.array(id).max(5, "Pick up to five."),
      motivation: z.string().trim().min(20, "Write at least a couple of sentences.").max(4000),
      experience: z.string().trim().max(4000).optional(),
      portfolio_url: z.string().trim().url("Enter a full link starting with https://").startsWith("https://", "Use an https:// link.").optional(),
    })
    .safeParse({
      cycle_id: formData.get("cycle_id"),
      domains: formData.getAll("domains"),
      teams: formData.getAll("teams"),
      motivation: formData.get("motivation"),
      experience: formData.get("experience") || undefined,
      portfolio_url: formData.get("portfolio_url") || undefined,
    });
  if (!parsed.success) return fromZodError(parsed.error, formData);
  const v = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_application", {
    p_cycle_id: v.cycle_id,
    p_domain_prefs: v.domains,
    p_team_prefs: v.teams,
    p_motivation: v.motivation,
    p_experience: v.experience ?? null,
    p_portfolio_url: v.portfolio_url ?? null,
    p_answers: {},
  });
  if (error) return fromRpcError(error, formData);
  redirect("/portal/applications?notice=submitted");
}

export async function withdrawApplication(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireOnboarded();
  const supabase = await createClient();
  const { error } = await supabase.rpc("withdraw_application", { p_application_id: id.parse(formData.get("application_id")) });
  if (error) return fromRpcError(error);
  revalidatePath("/portal/applications");
  return { ok: true, message: "Application withdrawn." };
}

// ---------------------------------------------------------------------------
// Manage
// ---------------------------------------------------------------------------

export async function moveApplication(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireManager();
  const applicationId = id.parse(formData.get("application_id"));
  const supabase = await createClient();
  const { error } = await supabase.rpc("move_application", {
    p_application_id: applicationId,
    p_status: formData.get("status")?.toString(),
  });
  if (error) return fromRpcError(error);
  revalidatePath(`/manage/recruitment/${applicationId}`);
  revalidatePath("/manage/recruitment");
  return { ok: true, message: "Application moved." };
}

export async function evaluateApplication(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireManager();
  const parsed = z
    .object({
      application_id: id,
      stage: z.enum(["screening", "interview"]),
      score: z.coerce.number().min(0, "0 to 10").max(10, "0 to 10").optional(),
      private_notes: z.string().trim().max(4000).optional(),
      recommendation: z.enum(["advance", "hold", "reject", "select"]),
    })
    .safeParse({
      application_id: formData.get("application_id"),
      stage: formData.get("stage"),
      score: formData.get("score") || undefined,
      private_notes: formData.get("private_notes") || undefined,
      recommendation: formData.get("recommendation"),
    });
  if (!parsed.success) return fromZodError(parsed.error, formData);
  const v = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.rpc("evaluate_application", {
    p_application_id: v.application_id,
    p_stage: v.stage,
    p_score: v.score ?? null,
    p_private_notes: v.private_notes ?? null,
    p_recommendation: v.recommendation,
  });
  if (error) return fromRpcError(error, formData);
  revalidatePath(`/manage/recruitment/${v.application_id}`);
  return { ok: true, message: "Evaluation saved." };
}

export async function decideApplication(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireManager();
  const applicationId = id.parse(formData.get("application_id"));
  const domains = formData.getAll("domains").map(String);
  const teams = formData.getAll("teams").map(String);
  const supabase = await createClient();
  const { error } = await supabase.rpc("decide_application", {
    p_application_id: applicationId,
    p_decision: formData.get("decision")?.toString(),
    p_domain_ids: domains.length ? domains : null,
    p_team_ids: teams.length ? teams : null,
  });
  if (error) return fromRpcError(error, formData);
  revalidatePath(`/manage/recruitment/${applicationId}`);
  revalidatePath("/manage/recruitment");
  return { ok: true, message: "Decision recorded and the applicant has been emailed." };
}

export async function verifyStudent(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireManager();
  const userId = id.parse(formData.get("user_id"));
  const supabase = await createClient();
  const { error } = await supabase.rpc("verify_student", {
    p_user_id: userId,
    p_approve: formData.get("approve") === "yes",
  });
  if (error) return fromRpcError(error);
  revalidatePath("/manage/members");
  revalidatePath("/manage/recruitment", "layout");
  return { ok: true, message: formData.get("approve") === "yes" ? "Student verified." : "Verification rejected." };
}

const cycleSchema = z.object({
  name: z.string().trim().min(3, "Name the cycle, e.g. Fall 2026.").max(100),
  description: z.string().trim().max(4000).optional(),
  opens_at: z.string().min(1, "Choose when it opens."),
  closes_at: z.string().min(1, "Choose when it closes."),
  status: z.enum(["draft", "open", "closed", "archived"]),
});

export async function saveCycle(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireManager();
  const parsed = cycleSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    opens_at: formData.get("opens_at"),
    closes_at: formData.get("closes_at"),
    status: formData.get("status"),
  });
  if (!parsed.success) return fromZodError(parsed.error, formData);
  const row = {
    ...parsed.data,
    description: parsed.data.description ?? null,
    opens_at: fromLocalInput(parsed.data.opens_at),
    closes_at: fromLocalInput(parsed.data.closes_at),
  };
  const supabase = await createClient();
  const cycleId = formData.get("cycle_id")?.toString();
  const { error } = cycleId
    ? await supabase.from("recruitment_cycles").update(row).eq("id", cycleId)
    : await supabase.from("recruitment_cycles").insert(row);
  if (error) return { error: "Couldn't save the cycle. Only the VP or President can manage cycles, and it must close after it opens." };
  revalidatePath("/manage/recruitment", "layout");
  revalidatePath("/join");
  return { ok: true, message: "Cycle saved." };
}

export async function setCycleReviewer(_: ActionState, formData: FormData): Promise<ActionState> {
  const viewer = await requireManager();
  const cycleId = id.parse(formData.get("cycle_id"));
  const userParse = id.safeParse(formData.get("user_id"));
  if (!userParse.success) return { error: "Pick a member from the search results." };
  const userId = userParse.data;
  const supabase = await createClient();
  const { error } =
    formData.get("intent") === "remove"
      ? await supabase.from("recruitment_reviewers").delete().eq("cycle_id", cycleId).eq("user_id", userId)
      : await supabase.from("recruitment_reviewers").insert({ cycle_id: cycleId, user_id: userId, assigned_by: viewer.id });
  if (error) return { error: "Couldn't update reviewers. Only the VP or President can assign them." };
  revalidatePath("/manage/recruitment", "layout");
  return { ok: true, message: "Reviewers updated." };
}
