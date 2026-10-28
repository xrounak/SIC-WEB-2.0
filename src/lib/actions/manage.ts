"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireManager } from "@/lib/auth";
import { fromRpcError, fromZodError, type ActionState } from "./state";

const id = z.string().uuid();
const slug = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Lowercase letters, numbers and dashes only.");

export async function saveTeam(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireManager();
  const parsed = z
    .object({
      name: z.string().trim().min(2).max(60),
      slug,
      description: z.string().trim().max(2000).optional(),
      team_type: z.enum(["technical", "operations", "media"]),
      domain_id: id.optional(),
      is_active: z.boolean(),
    })
    .safeParse({
      name: formData.get("name"),
      slug: formData.get("slug"),
      description: formData.get("description") || undefined,
      team_type: formData.get("team_type"),
      domain_id: formData.get("domain_id") || undefined,
      is_active: formData.get("is_active") === "on",
    });
  if (!parsed.success) return fromZodError(parsed.error, formData);
  const row = { ...parsed.data, description: parsed.data.description ?? null, domain_id: parsed.data.domain_id ?? null };
  const supabase = await createClient();
  const teamId = formData.get("team_id")?.toString();
  const { error } = teamId ? await supabase.from("teams").update(row).eq("id", teamId) : await supabase.from("teams").insert(row);
  if (error) return { error: error.code === "23505" ? "That slug is taken." : "Couldn't save. Only the VP, President or admin can edit teams." };
  revalidatePath("/manage/teams");
  revalidatePath("/domains", "layout");
  return { ok: true, message: "Team saved." };
}

export async function saveDomain(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireManager();
  const parsed = z
    .object({
      name: z.string().trim().min(2).max(60),
      slug,
      description: z.string().trim().max(2000).optional(),
      sort_order: z.coerce.number().int().min(0).max(1000),
      is_active: z.boolean(),
    })
    .safeParse({
      name: formData.get("name"),
      slug: formData.get("slug"),
      description: formData.get("description") || undefined,
      sort_order: formData.get("sort_order") || 0,
      is_active: formData.get("is_active") === "on",
    });
  if (!parsed.success) return fromZodError(parsed.error, formData);
  const row = { ...parsed.data, description: parsed.data.description ?? null };
  const supabase = await createClient();
  const domainId = formData.get("domain_id")?.toString();
  const { error } = domainId ? await supabase.from("domains").update(row).eq("id", domainId) : await supabase.from("domains").insert(row);
  if (error) return { error: error.code === "23505" ? "That name or slug is taken." : "Couldn't save the domain." };
  revalidatePath("/manage/teams");
  revalidatePath("/domains", "layout");
  return { ok: true, message: "Domain saved." };
}

export async function setTeamMember(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireManager();
  const teamId = id.parse(formData.get("team_id"));
  const userId = formData.get("user_id")?.toString();
  if (!userId || !id.safeParse(userId).success) return { error: "Pick a member from the search results." };
  const role = formData.get("team_role")?.toString();
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_team_member", {
    p_team_id: teamId,
    p_user_id: userId,
    p_team_role: role === "remove" ? null : role,
  });
  if (error) return fromRpcError(error);
  revalidatePath("/manage/teams");
  return { ok: true, message: role === "remove" ? "Removed from team." : "Team seat updated." };
}

const announcementSchema = z.object({
  title: z.string().trim().min(3, "Use at least 3 characters.").max(140),
  body: z.string().trim().min(5, "Write the announcement.").max(20000),
  audience: z.enum(["public", "members", "team"]),
  team_id: id.optional(),
});

export async function saveAnnouncement(_: ActionState, formData: FormData): Promise<ActionState> {
  const viewer = await requireManager();
  const parsed = announcementSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
    audience: formData.get("audience"),
    team_id: formData.get("team_id") || undefined,
  });
  if (!parsed.success) return fromZodError(parsed.error, formData);
  const v = parsed.data;
  if (v.audience === "team" && !v.team_id) return { error: "Choose a team.", fieldErrors: { team_id: "Choose a team." } };
  const row = { title: v.title, body: v.body, audience: v.audience, team_id: v.audience === "team" ? v.team_id! : null };

  const supabase = await createClient();
  const { data, error } = await supabase.from("announcements").insert({ ...row, created_by: viewer.id }).select("id").single();
  if (error || !data) {
    return { error: "You can't post to that audience. Leads post to their own team; the VP and President post to everyone." };
  }
  if (formData.get("intent") === "publish") {
    const { error: pubError } = await supabase.rpc("publish_announcement", { p_announcement_id: data.id });
    if (pubError) return fromRpcError(pubError);
  }
  revalidatePath("/manage/announcements");
  revalidatePath("/");
  return { ok: true, message: formData.get("intent") === "publish" ? "Published." : "Draft saved." };
}

export async function announcementAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireManager();
  const announcementId = id.parse(formData.get("announcement_id"));
  const intent = formData.get("intent")?.toString();
  const supabase = await createClient();
  const { error } =
    intent === "publish"
      ? await supabase.rpc("publish_announcement", { p_announcement_id: announcementId })
      : intent === "archive"
        ? await supabase.rpc("archive_announcement", { p_announcement_id: announcementId })
        : await supabase.from("announcements").delete().eq("id", announcementId);
  if (error) return fromRpcError(error);
  revalidatePath("/manage/announcements");
  revalidatePath("/");
  return { ok: true };
}

export async function roleAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireManager();
  const role = formData.get("role")?.toString();
  const supabase = await createClient();
  let userId = formData.get("user_id")?.toString();
  const email = formData.get("email")?.toString().trim().toLowerCase();
  if (!userId && email) {
    const { data } = await supabase.from("profiles").select("id").eq("email", email).maybeSingle();
    if (!data) return { error: "No account uses that email. They need to sign in once first.", values: { email, role: role ?? "" } };
    userId = data.id as string;
  }
  if (!userId) return { error: "Enter an email." };
  const { error } = await supabase.rpc(formData.get("intent") === "revoke" ? "revoke_role" : "assign_role", {
    p_user_id: userId,
    p_role: role,
  });
  if (error) return fromRpcError(error);
  revalidatePath("/manage/roles");
  return { ok: true, message: formData.get("intent") === "revoke" ? "Role removed." : "Role assigned." };
}
