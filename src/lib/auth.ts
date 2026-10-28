import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { AppRole, Profile } from "@/lib/types";

export type Viewer = {
  id: string;
  profile: Profile;
  roles: AppRole[];
  leadTeamIds: string[];
  isMember: boolean;
  isExec: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  isLead: boolean;
  /** Can open /manage at all. Each page and RPC still checks its own scope. */
  canManage: boolean;
};

/**
 * Current user with profile, roles and lead seats, read once per request.
 * Data access layer: pages and actions use this instead of reading auth directly.
 * The values only shape the UI; RLS and the workflow RPCs enforce access.
 */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return null;

  const [{ data: profile }, { data: roleRows }, { data: leadRows }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase.from("user_roles").select("role").eq("user_id", userId),
    supabase
      .from("team_members")
      .select("team_id")
      .eq("member_id", userId)
      .eq("team_role", "lead")
      .eq("status", "active"),
  ]);
  if (!profile) return null;

  const roles = (roleRows ?? []).map((r) => r.role as AppRole);
  const leadTeamIds = (leadRows ?? []).map((r) => r.team_id as string);
  const isExec = roles.includes("president") || roles.includes("vice_president");
  const isAdmin = roles.includes("admin");
  const isStaff = roles.length > 0;
  const isLead = leadTeamIds.length > 0;

  return {
    id: userId,
    profile: profile as Profile,
    roles,
    leadTeamIds,
    isMember: profile.member_status === "member",
    isExec,
    isAdmin,
    isStaff,
    isLead,
    canManage: isStaff || isLead,
  };
});

/** Path of the current request, set by proxy.ts. */
export async function currentPath() {
  return (await headers()).get("x-pathname") ?? "/";
}

export async function requireViewer(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=${encodeURIComponent(await currentPath())}`);
  return viewer;
}

export async function requireOnboarded(): Promise<Viewer> {
  const viewer = await requireViewer();
  if (!viewer.profile.onboarded_at) {
    redirect(`/onboarding?next=${encodeURIComponent(await currentPath())}`);
  }
  return viewer;
}

export async function requireMember(): Promise<Viewer> {
  const viewer = await requireOnboarded();
  if (!viewer.isMember) redirect("/portal?notice=members-only");
  return viewer;
}

export async function requireManager(): Promise<Viewer> {
  const viewer = await requireOnboarded();
  if (!viewer.canManage) redirect("/portal?notice=no-access");
  return viewer;
}
