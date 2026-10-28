import type { Metadata } from "next";
import { requireManager } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getTeams } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { announcementAction, saveAnnouncement } from "@/lib/actions/manage";
import { ActionForm, SelectField, SubmitButton, TextAreaField, TextField } from "@/components/ui/form";
import { Badge, Card, EmptyState, PageHeader, SectionTitle, StatusBadge } from "@/components/ui/primitives";
import type { Announcement } from "@/lib/types";

export const metadata: Metadata = { title: "Announcements · Manage" };

export default async function AnnouncementsPage() {
  const viewer = await requireManager();
  const supabase = await createClient();
  const [{ data }, teams] = await Promise.all([
    supabase.from("announcements").select("*").order("created_at", { ascending: false }).limit(50),
    getTeams(),
  ]);
  const items = (data ?? []) as Announcement[];
  const myTeams = viewer.isExec ? teams : teams.filter((t) => viewer.leadTeamIds.includes(t.id));
  const audiences = [
    ...(viewer.isExec
      ? [
          { value: "public", label: "Public (website)" },
          { value: "members", label: "All members" },
        ]
      : []),
    { value: "team", label: "One team" },
  ];
  const teamName = (id: string | null) => teams.find((t) => t.id === id)?.name ?? "Team";

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Manage"
        title="Announcements"
        description="Publishing notifies the audience in their portal. Public announcements also appear on the home page."
      />

      <Card className="p-5">
        <h2 className="mb-4 text-lg font-semibold">New announcement</h2>
        <ActionForm action={saveAnnouncement}>
          <TextField name="title" label="Title" maxLength={140} />
          <TextAreaField name="body" label="Message" rows={5} />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField name="audience" label="Audience" options={audiences} defaultValue={audiences[0].value} />
            <SelectField
              name="team_id"
              label="Team"
              required={false}
              placeholder="Only for team audience"
              options={myTeams.map((t) => ({ value: t.id, label: t.name }))}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <SubmitButton name="intent" value="publish">
              Publish now
            </SubmitButton>
            <SubmitButton name="intent" value="draft" variant="secondary">
              Save draft
            </SubmitButton>
          </div>
        </ActionForm>
      </Card>

      <section className="flex flex-col gap-3">
        <SectionTitle title="Recent" />
        {items.length === 0 ? (
          <EmptyState title="No announcements yet" />
        ) : (
          items.map((a) => (
            <Card key={a.id} className="flex flex-col gap-2 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={a.status} />
                <Badge tone="accent">{a.audience === "team" ? teamName(a.team_id) : a.audience === "members" ? "All members" : "Public"}</Badge>
                <span className="text-[0.75rem] text-subtle">{formatDate(a.published_at ?? a.created_at)}</span>
              </div>
              <p className="font-medium">{a.title}</p>
              <p className="line-clamp-3 text-sm text-muted">{a.body}</p>
              {a.created_by === viewer.id || viewer.isExec ? (
                <div className="flex gap-2">
                  {a.status === "draft" && (
                    <>
                      <ActionForm action={announcementAction} hideMessages className="gap-0">
                        <input type="hidden" name="announcement_id" value={a.id} />
                        <SubmitButton size="sm" name="intent" value="publish" pendingLabel="…">
                          Publish
                        </SubmitButton>
                      </ActionForm>
                      <ActionForm action={announcementAction} hideMessages className="gap-0">
                        <input type="hidden" name="announcement_id" value={a.id} />
                        <SubmitButton size="sm" variant="ghost" name="intent" value="delete" pendingLabel="…">
                          Delete
                        </SubmitButton>
                      </ActionForm>
                    </>
                  )}
                  {a.status === "published" && (
                    <ActionForm action={announcementAction} hideMessages className="gap-0">
                      <input type="hidden" name="announcement_id" value={a.id} />
                      <SubmitButton size="sm" variant="ghost" name="intent" value="archive" pendingLabel="…">
                        Archive
                      </SubmitButton>
                    </ActionForm>
                  )}
                </div>
              ) : null}
            </Card>
          ))
        )}
      </section>
    </div>
  );
}
