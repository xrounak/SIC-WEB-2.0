import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Announcement, Domain, Project, RecruitmentCycle, SicEvent, Team } from "@/lib/types";

/**
 * Public read helpers. They run as the current visitor (anon or signed in), so RLS
 * decides visibility. Without Supabase configured they return empty results.
 */
async function db() {
  return isSupabaseConfigured() ? createClient() : null;
}

export const getDomains = cache(async (): Promise<Domain[]> => {
  const supabase = await db();
  if (!supabase) return [];
  const { data } = await supabase.from("domains").select("*").eq("is_active", true).order("sort_order");
  return (data ?? []) as Domain[];
});

export const getTeams = cache(async (): Promise<Team[]> => {
  const supabase = await db();
  if (!supabase) return [];
  const { data } = await supabase.from("teams").select("*").eq("is_active", true).order("name");
  return (data ?? []) as Team[];
});

const EVENT_CARD_COLUMNS =
  "id, slug, title, summary, event_type, status, visibility, venue, starts_at, ends_at, reg_opens_at, reg_closes_at, capacity, participation, team_min, team_max, owner_team_id, domain_id, cover_path, is_major, created_by, published_at, created_at, description";

export async function getUpcomingEvents(limit = 12, domainId?: string): Promise<SicEvent[]> {
  const supabase = await db();
  if (!supabase) return [];
  let query = supabase
    .from("events")
    .select(EVENT_CARD_COLUMNS)
    .eq("status", "published")
    .gte("starts_at", new Date(Date.now() - 6 * 3600 * 1000).toISOString())
    .order("starts_at", { ascending: true })
    .limit(limit);
  if (domainId) query = query.eq("domain_id", domainId);
  const { data } = await query;
  return (data ?? []) as SicEvent[];
}

export async function getPastEvents(limit = 12): Promise<SicEvent[]> {
  const supabase = await db();
  if (!supabase) return [];
  const { data } = await supabase
    .from("events")
    .select(EVENT_CARD_COLUMNS)
    .in("status", ["completed", "published", "cancelled"])
    .lt("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as SicEvent[];
}

export async function getEventBySlug(slug: string): Promise<SicEvent | null> {
  const supabase = await db();
  if (!supabase) return null;
  const { data } = await supabase.from("events").select("*").eq("slug", slug).maybeSingle();
  return (data as SicEvent) ?? null;
}

export async function getSeatsTaken(eventId: string): Promise<number> {
  const supabase = await db();
  if (!supabase) return 0;
  const { data } = await supabase.from("event_seat_counts").select("seats_taken").eq("event_id", eventId).maybeSingle();
  return Number(data?.seats_taken ?? 0);
}

export async function getPublishedProjects(limit = 24, domainId?: string): Promise<Project[]> {
  const supabase = await db();
  if (!supabase) return [];
  if (domainId) {
    const { data: tagged } = await supabase.from("project_domains").select("project_id").eq("domain_id", domainId);
    const ids = (tagged ?? []).map((t) => t.project_id as string);
    if (ids.length === 0) return [];
    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("status", "published")
      .in("id", ids)
      .order("published_at", { ascending: false })
      .limit(limit);
    return (data ?? []) as Project[];
  }
  const { data } = await supabase
    .from("projects")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as Project[];
}

export async function getProjectBySlug(slug: string) {
  const supabase = await db();
  if (!supabase) return null;
  const { data: project } = await supabase.from("projects").select("*").eq("slug", slug).maybeSingle();
  if (!project) return null;
  const [{ data: contributors }, { data: domains }, { data: media }] = await Promise.all([
    supabase.from("public_project_contributors").select("*").eq("project_id", project.id),
    supabase.from("project_domains").select("domain_id, domains(name, slug)").eq("project_id", project.id),
    supabase.from("project_media").select("*").eq("project_id", project.id).order("sort_order"),
  ]);
  return {
    project: project as Project,
    contributors: (contributors ?? []) as Array<{ member_id: string; full_name: string; avatar_url: string | null; contribution: string | null }>,
    domains: (domains ?? []).map((d) => d.domains as unknown as { name: string; slug: string }).filter(Boolean),
    media: (media ?? []) as Array<{ id: string; storage_path: string; media_type: string; caption: string | null }>,
  };
}

export async function getOpenCycle(): Promise<RecruitmentCycle | null> {
  const supabase = await db();
  if (!supabase) return null;
  const now = new Date().toISOString();
  const { data } = await supabase
    .from("recruitment_cycles")
    .select("*")
    .eq("status", "open")
    .lte("opens_at", now)
    .gte("closes_at", now)
    .order("closes_at")
    .limit(1)
    .maybeSingle();
  return (data as RecruitmentCycle) ?? null;
}

export async function getNextCycle(): Promise<RecruitmentCycle | null> {
  const supabase = await db();
  if (!supabase) return null;
  const { data } = await supabase
    .from("recruitment_cycles")
    .select("*")
    .in("status", ["open", "closed"])
    .gt("opens_at", new Date().toISOString())
    .order("opens_at")
    .limit(1)
    .maybeSingle();
  return (data as RecruitmentCycle) ?? null;
}

export async function getPublicAnnouncements(limit = 3): Promise<Announcement[]> {
  const supabase = await db();
  if (!supabase) return [];
  const { data } = await supabase
    .from("announcements")
    .select("*")
    .eq("status", "published")
    .eq("audience", "public")
    .order("published_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as Announcement[];
}

export async function getLeadership() {
  const supabase = await db();
  if (!supabase) return { officers: [], leads: [] };
  const [{ data: officers }, { data: leads }] = await Promise.all([
    supabase.from("public_leadership").select("*"),
    supabase.from("public_team_members").select("team_id, member_id, full_name, avatar_url").eq("team_role", "lead"),
  ]);
  return {
    officers: (officers ?? []) as Array<{ role: string; member_id: string; full_name: string; avatar_url: string | null; bio: string | null; branch: string | null }>,
    leads: (leads ?? []) as Array<{ team_id: string; member_id: string; full_name: string; avatar_url: string | null }>,
  };
}
