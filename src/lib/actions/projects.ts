"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireMember, requireOnboarded } from "@/lib/auth";
import { formValues, fromRpcError, fromZodError, type ActionState } from "./state";

const id = z.string().uuid();
const httpsUrl = z.string().trim().url("Enter a full link.").startsWith("https://", "Use an https:// link.");

const projectSchema = z.object({
  title: z.string().trim().min(3, "Use at least 3 characters.").max(140),
  summary: z.string().trim().min(10, "Write a one-line summary.").max(300),
  problem: z.string().trim().min(20, "Describe the problem in a few sentences.").max(8000),
  solution: z.string().trim().min(20, "Describe what you built.").max(8000),
  outcomes: z.string().trim().max(8000).optional(),
  hardware_details: z.string().trim().max(8000).optional(),
  software_details: z.string().trim().max(8000).optional(),
  repo_url: httpsUrl.optional(),
  demo_url: httpsUrl.optional(),
  visibility: z.enum(["public", "members"]),
  owner_team_id: id,
  domains: z.array(id).max(5),
});

export async function saveProject(_: ActionState, formData: FormData): Promise<ActionState> {
  const viewer = await requireMember();
  const opt = (k: string) => formData.get(k) || undefined;
  const parsed = projectSchema.safeParse({
    title: formData.get("title"),
    summary: formData.get("summary"),
    problem: formData.get("problem"),
    solution: formData.get("solution"),
    outcomes: opt("outcomes"),
    hardware_details: opt("hardware_details"),
    software_details: opt("software_details"),
    repo_url: opt("repo_url"),
    demo_url: opt("demo_url"),
    visibility: formData.get("visibility"),
    owner_team_id: formData.get("owner_team_id"),
    domains: formData.getAll("domains"),
  });
  if (!parsed.success) return fromZodError(parsed.error, formData);
  const { domains, ...v } = parsed.data;
  const row = {
    ...v,
    outcomes: v.outcomes ?? null,
    hardware_details: v.hardware_details ?? null,
    software_details: v.software_details ?? null,
    repo_url: v.repo_url ?? null,
    demo_url: v.demo_url ?? null,
  };

  const supabase = await createClient();
  let projectId = formData.get("project_id")?.toString();
  if (projectId) {
    const { error } = await supabase.from("projects").update(row).eq("id", projectId);
    if (error) return { error: "Couldn't save. This project may no longer be editable.", values: formValues(formData) };
  } else {
    const { data, error } = await supabase.from("projects").insert({ ...row, created_by: viewer.id }).select("id").single();
    if (error || !data) return { error: "Couldn't save the draft. Try again.", values: formValues(formData) };
    projectId = data.id as string;
  }

  await supabase.from("project_domains").delete().eq("project_id", projectId);
  if (domains.length) {
    await supabase.from("project_domains").insert(domains.map((domain_id) => ({ project_id: projectId, domain_id })));
  }

  if (formData.get("intent") === "submit") {
    const { error } = await supabase.rpc("submit_project", { p_project_id: projectId });
    if (error) return fromRpcError(error, formData);
  }
  revalidatePath("/portal/projects");
  redirect(`/portal/projects/${projectId}/edit?notice=${formData.get("intent") === "submit" ? "submitted" : "saved"}`);
}

export async function addContributor(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireMember();
  const projectId = id.parse(formData.get("project_id"));
  const memberId = formData.get("member_id")?.toString();
  if (!memberId || !id.safeParse(memberId).success) return { error: "Pick a member from the search results." };
  const contribution = formData.get("contribution")?.toString().trim().slice(0, 200) || null;
  const supabase = await createClient();
  const { error } = await supabase.from("project_contributors").insert({ project_id: projectId, member_id: memberId, contribution });
  if (error) return { error: "Couldn't add them. They may already be listed, or the project isn't editable." };
  revalidatePath(`/portal/projects/${projectId}/edit`);
  return { ok: true, message: "Contributor added. They'll confirm when you submit." };
}

export async function removeContributor(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireMember();
  const projectId = id.parse(formData.get("project_id"));
  const memberId = id.parse(formData.get("member_id"));
  const supabase = await createClient();
  await supabase.from("project_contributors").delete().eq("project_id", projectId).eq("member_id", memberId);
  revalidatePath(`/portal/projects/${projectId}/edit`);
  return { ok: true, message: "Removed." };
}

/** Member search for the contributor picker. Called from a client component. */
export async function searchMembers(query: string) {
  // Members and staff (who may not be members, e.g. faculty). The RPC enforces this.
  await requireOnboarded();
  const supabase = await createClient();
  const { data } = await supabase.rpc("search_members", { p_query: query });
  return (data ?? []) as Array<{ id: string; full_name: string; avatar_url: string | null; branch: string | null; academic_year: number | null }>;
}

export async function confirmContribution(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireOnboarded();
  const projectId = id.parse(formData.get("project_id"));
  const accept = formData.get("decision") !== "decline";
  const supabase = await createClient();
  const { error } = await supabase.rpc("confirm_contribution", {
    p_project_id: projectId,
    p_accept: accept,
    p_is_public: formData.get("is_public") === "on",
  });
  if (error) return fromRpcError(error);
  revalidatePath("/portal/projects");
  return { ok: true, message: accept ? "Thanks, you're credited." : "You've been removed from this project." };
}

export async function deleteDraftProject(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireMember();
  const projectId = id.parse(formData.get("project_id"));
  const supabase = await createClient();
  const { error } = await supabase.from("projects").delete().eq("id", projectId).eq("status", "draft");
  if (error) return { error: "Only drafts can be deleted." };
  redirect("/portal/projects?notice=deleted");
}

// ---------------------------------------------------------------------------
// Manage
// ---------------------------------------------------------------------------

export async function reviewProject(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireOnboarded();
  const projectId = id.parse(formData.get("project_id"));
  const decision = formData.get("decision")?.toString();
  const notes = formData.get("notes")?.toString().trim() || null;
  const supabase = await createClient();
  if (decision === "start") {
    const { error } = await supabase.rpc("start_project_review", { p_project_id: projectId });
    if (error) return fromRpcError(error);
  } else {
    const { error } = await supabase.rpc("review_project", { p_project_id: projectId, p_decision: decision, p_notes: notes });
    if (error) return fromRpcError(error, formData);
  }
  revalidatePath(`/manage/projects/${projectId}`);
  revalidatePath("/manage/projects");
  revalidatePath("/projects");
  return { ok: true, message: decision === "start" ? "Marked as in review." : "Decision recorded. The author has been notified." };
}
