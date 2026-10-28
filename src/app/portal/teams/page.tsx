import type { Metadata } from "next";
import { requireMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Avatar, Badge, Card, EmptyState, PageHeader } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "My teams" };

export default async function MyTeamsPage() {
  const viewer = await requireMember();
  const supabase = await createClient();
  const [{ data: seats }, { data: domains }] = await Promise.all([
    supabase.from("team_members").select("team_id, team_role, teams(name, description)").eq("member_id", viewer.id).eq("status", "active"),
    supabase.from("member_domains").select("domains(name)").eq("member_id", viewer.id),
  ]);
  const teamIds = (seats ?? []).map((s) => s.team_id as string);
  const { data: roster } = teamIds.length
    ? await supabase
        .from("team_members")
        .select("team_id, team_role, member_id")
        .in("team_id", teamIds)
        .eq("status", "active")
    : { data: [] };

  const myTeams = (seats ?? []) as unknown as Array<{ team_id: string; team_role: string; teams: { name: string; description: string | null } | null }>;
  const memberIds = [...new Set((roster ?? []).map((r) => r.member_id as string))];
  const { data: directory } = memberIds.length
    ? await supabase.from("member_directory").select("id, full_name, avatar_url").in("id", memberIds)
    : { data: [] };
  const names = new Map((directory ?? []).map((d) => [d.id as string, d as { full_name: string; avatar_url: string | null }]));
  const people = (roster ?? []).map((r) => ({
    team_id: r.team_id as string,
    team_role: r.team_role as string,
    member_id: r.member_id as string,
    profiles: names.get(r.member_id as string) ?? null,
  }));

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="My teams" description="Teams you belong to and the people in them." />
      <div className="flex flex-wrap gap-2">
        {(domains ?? []).map((d, i) => (
          <Badge key={i} tone="accent">
            {(d.domains as unknown as { name: string } | null)?.name}
          </Badge>
        ))}
      </div>
      {myTeams.length === 0 ? (
        <EmptyState title="You're not on a team yet" description="The VP or President assigns team seats after recruitment." />
      ) : (
        myTeams.map((t) => {
          const members = people.filter((p) => p.team_id === t.team_id);
          return (
            <Card key={t.team_id} className="flex flex-col gap-4 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">{t.teams?.name}</h2>
                <Badge tone={t.team_role === "lead" ? "accent" : "neutral"}>You: {t.team_role}</Badge>
              </div>
              {t.teams?.description && <p className="text-sm text-muted">{t.teams.description}</p>}
              <ul className="grid gap-2 sm:grid-cols-2">
                {members
                  .sort((a, b) => (a.team_role === "lead" ? -1 : b.team_role === "lead" ? 1 : 0))
                  .map((m) => (
                    <li key={m.member_id} className="flex items-center gap-3 rounded-lg border border-line p-2.5">
                      <Avatar name={m.profiles?.full_name ?? "?"} src={m.profiles?.avatar_url} size={28} />
                      <span className="min-w-0 flex-1 truncate text-sm">{m.profiles?.full_name ?? "Member"}</span>
                      {m.team_role !== "member" && <span className="font-mono text-[0.6875rem] text-primary">{m.team_role}</span>}
                    </li>
                  ))}
              </ul>
            </Card>
          );
        })
      )}
    </div>
  );
}
