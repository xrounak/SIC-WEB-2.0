import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireManager } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { saveDomain, saveTeam, setTeamMember } from "@/lib/actions/manage";
import { ActionForm, CheckboxField, SelectField, SubmitButton, TextField } from "@/components/ui/form";
import { MemberSelect } from "@/components/forms/member-select";
import { Badge, Card, PageHeader, SectionTitle } from "@/components/ui/primitives";
import type { Domain, Team } from "@/lib/types";

export const metadata: Metadata = { title: "Teams & domains · Manage" };

export default async function TeamsPage() {
  const viewer = await requireManager();
  if (!viewer.isExec && !viewer.isAdmin) redirect("/manage");
  const supabase = await createClient();
  const [{ data: teamRows }, { data: domainRows }, { data: seats }] = await Promise.all([
    supabase.from("teams").select("*").order("name"),
    supabase.from("domains").select("*").order("sort_order"),
    supabase.from("team_members").select("team_id, member_id, team_role").eq("status", "active"),
  ]);
  const teams = (teamRows ?? []) as Team[];
  const domains = (domainRows ?? []) as Domain[];
  const ids = [...new Set((seats ?? []).map((s) => s.member_id as string))];
  const { data: names } = ids.length ? await supabase.from("member_directory").select("id, full_name").in("id", ids) : { data: [] };
  const nameOf = new Map((names ?? []).map((n) => [n.id as string, n.full_name as string]));
  const domainOptions = domains.map((d) => ({ value: d.id, label: d.name }));
  const typeOptions = [
    { value: "technical", label: "Technical" },
    { value: "operations", label: "Operations" },
    { value: "media", label: "Media" },
  ];

  return (
    <div className="flex flex-col gap-10">
      <PageHeader eyebrow="Manage" title="Teams & domains" description="Set up the club's structure and decide who leads each team." />

      <section className="flex flex-col gap-4">
        <SectionTitle title="Teams" />
        {teams.map((t) => {
          const members = (seats ?? []).filter((s) => s.team_id === t.id);
          return (
            <Card key={t.id} className="flex flex-col gap-4 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold">{t.name}</h3>
                <Badge>{t.team_type}</Badge>
                {!t.is_active && <Badge tone="warning">Inactive</Badge>}
              </div>
              <ul className="flex flex-wrap gap-2">
                {members.length === 0 && <li className="text-sm text-muted">No members yet.</li>}
                {members
                  .sort((a, b) => (a.team_role === "lead" ? -1 : b.team_role === "lead" ? 1 : 0))
                  .map((m) => (
                    <li key={m.member_id} className="rounded-lg border border-line px-2.5 py-1 text-[0.8125rem]">
                      {nameOf.get(m.member_id as string) ?? "Member"}
                      {m.team_role !== "member" && <span className="ml-1.5 font-mono text-primary">{m.team_role}</span>}
                    </li>
                  ))}
              </ul>
              <ActionForm action={setTeamMember}>
                <input type="hidden" name="team_id" value={t.id} />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <MemberSelect label="Member" />
                  <div className="sm:w-40">
                    <SelectField
                      name="team_role"
                      label="Seat"
                      defaultValue="member"
                      options={[
                        { value: "member", label: "Member" },
                        { value: "deputy", label: "Deputy" },
                        { value: "lead", label: "Lead" },
                        { value: "remove", label: "Remove from team" },
                      ]}
                    />
                  </div>
                  <SubmitButton variant="secondary" pendingLabel="…">
                    Update
                  </SubmitButton>
                </div>
              </ActionForm>
              <details className="rounded-lg border border-line">
                <summary className="cursor-pointer px-3 py-2 text-sm text-muted">Edit team details</summary>
                <div className="border-t border-line p-4">
                  <TeamForm team={t} domainOptions={domainOptions} typeOptions={typeOptions} />
                </div>
              </details>
            </Card>
          );
        })}
        <details className="rounded-xl border border-dashed border-line-strong">
          <summary className="cursor-pointer px-4 py-3 text-sm text-primary">+ Add a team</summary>
          <div className="border-t border-line p-4">
            <TeamForm domainOptions={domainOptions} typeOptions={typeOptions} />
          </div>
        </details>
      </section>

      <section className="flex flex-col gap-4">
        <SectionTitle title="Domains" />
        {[...domains, undefined].map((d) => (
          <details key={d?.id ?? "new"} className={d ? "rounded-xl border border-line bg-surface" : "rounded-xl border border-dashed border-line-strong"}>
            <summary className={`cursor-pointer px-4 py-3 text-sm ${d ? "" : "text-primary"}`}>
              {d ? (
                <>
                  <span className="font-medium">{d.name}</span>
                  {!d.is_active && <Badge tone="warning" className="ml-2">Inactive</Badge>}
                </>
              ) : (
                "+ Add a domain"
              )}
            </summary>
            <div className="border-t border-line p-4">
              <ActionForm action={saveDomain}>
                {d && <input type="hidden" name="domain_id" value={d.id} />}
                <div className="grid gap-4 sm:grid-cols-3">
                  <TextField name="name" label="Name" defaultValue={d?.name} />
                  <TextField name="slug" label="URL slug" defaultValue={d?.slug} hint="e.g. ai-ml" />
                  <TextField name="sort_order" label="Order" type="number" defaultValue={d?.sort_order ?? 100} />
                </div>
                <TextField name="description" label="Description" required={false} defaultValue={d?.description} />
                <CheckboxField name="is_active" label="Active" defaultChecked={d?.is_active ?? true} />
                <SubmitButton variant="secondary" className="self-start">
                  Save domain
                </SubmitButton>
              </ActionForm>
            </div>
          </details>
        ))}
      </section>
    </div>
  );
}

function TeamForm({
  team,
  domainOptions,
  typeOptions,
}: {
  team?: Team;
  domainOptions: Array<{ value: string; label: string }>;
  typeOptions: Array<{ value: string; label: string }>;
}) {
  return (
    <ActionForm action={saveTeam}>
      {team && <input type="hidden" name="team_id" value={team.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="name" label="Name" defaultValue={team?.name} />
        <TextField name="slug" label="URL slug" defaultValue={team?.slug} />
        <SelectField name="team_type" label="Type" options={typeOptions} defaultValue={team?.team_type ?? "technical"} />
        <SelectField name="domain_id" label="Domain" required={false} placeholder="None" options={domainOptions} defaultValue={team?.domain_id} />
      </div>
      <TextField name="description" label="Description" required={false} defaultValue={team?.description} />
      <CheckboxField name="is_active" label="Active" defaultChecked={team?.is_active ?? true} />
      <SubmitButton variant="secondary" className="self-start">
        Save team
      </SubmitButton>
    </ActionForm>
  );
}
