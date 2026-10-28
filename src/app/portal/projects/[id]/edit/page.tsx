import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getDomains, getTeams } from "@/lib/data";
import { deleteDraftProject, removeContributor } from "@/lib/actions/projects";
import { ProjectForm } from "@/components/forms/project-form";
import { ContributorPicker } from "@/components/forms/contributor-picker";
import { ActionForm, SubmitButton } from "@/components/ui/form";
import { Avatar, Card, Notice, PageHeader, StatusBadge } from "@/components/ui/primitives";
import { ReviewTimeline } from "@/components/review-timeline";
import { QueryNotice } from "@/components/query-notice";
import type { Project } from "@/lib/types";

export const metadata: Metadata = { title: "Edit project" };

export default async function EditProjectPage({ params, searchParams }: PageProps<"/portal/projects/[id]/edit">) {
  const { id } = await params;
  const viewer = await requireMember();
  const supabase = await createClient();
  const { data } = await supabase.from("projects").select("*").eq("id", id).eq("created_by", viewer.id).maybeSingle();
  if (!data) notFound();
  const project = data as Project;

  const [{ data: contributors }, { data: tags }, { data: reviews }, teams, domains] = await Promise.all([
    supabase.from("project_contributors").select("member_id, contribution, confirmed_at").eq("project_id", id),
    supabase.from("project_domains").select("domain_id").eq("project_id", id),
    supabase.from("project_reviews").select("*").eq("project_id", id).order("created_at"),
    getTeams(),
    getDomains(),
  ]);
  const memberIds = (contributors ?? []).map((c) => c.member_id as string);
  const { data: names } = memberIds.length
    ? await supabase.from("member_directory").select("id, full_name, avatar_url").in("id", memberIds)
    : { data: [] };
  const nameOf = new Map((names ?? []).map((n) => [n.id as string, n as { full_name: string; avatar_url: string | null }]));
  const editable = ["draft", "changes_requested"].includes(project.status);
  const latestNotes = (reviews ?? []).findLast((r) => r.decision !== "approved")?.notes as string | undefined;

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <QueryNotice searchParams={searchParams} />
      <Link href="/portal/projects" className="text-sm text-muted hover:text-fg">
        ← Projects
      </Link>
      <PageHeader title={project.title} actions={<StatusBadge status={project.status} />} />

      {project.status === "changes_requested" && latestNotes && (
        <Notice tone="warning" title="Changes requested">
          <span className="prose-sic">{latestNotes}</span>
        </Notice>
      )}
      {project.status === "published" && project.slug && (
        <Notice tone="success" title="Published.">
          <Link href={`/projects/${project.slug}`} className="text-primary underline">
            View the public page
          </Link>
        </Notice>
      )}

      <Card className="flex flex-col gap-4 p-5">
        <h2 className="text-lg font-semibold">Contributors</h2>
        <ul className="flex flex-col gap-2">
          {(contributors ?? []).map((c) => {
            const person = nameOf.get(c.member_id as string);
            return (
              <li key={c.member_id} className="flex flex-wrap items-center gap-3 rounded-lg border border-line p-2.5">
                <Avatar name={person?.full_name ?? "?"} src={person?.avatar_url} size={28} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{person?.full_name ?? "Member"}</span>
                  {c.contribution && <span className="block truncate text-[0.75rem] text-subtle">{c.contribution}</span>}
                </span>
                <StatusBadge status={c.confirmed_at ? "accepted" : "pending"} />
                {editable && c.member_id !== viewer.id && (
                  <ActionForm action={removeContributor} hideMessages className="gap-0">
                    <input type="hidden" name="project_id" value={id} />
                    <input type="hidden" name="member_id" value={c.member_id} />
                    <SubmitButton size="sm" variant="ghost" pendingLabel="…">
                      Remove
                    </SubmitButton>
                  </ActionForm>
                )}
              </li>
            );
          })}
          {(contributors ?? []).length === 0 && <li className="text-sm text-muted">Just you so far. You&apos;re added automatically when you submit.</li>}
        </ul>
        {editable && <ContributorPicker projectId={id} excludeIds={[...memberIds, viewer.id]} />}
      </Card>

      {(reviews ?? []).length > 0 && (
        <Card className="p-5">
          <h2 className="mb-4 text-lg font-semibold">Review history</h2>
          <ReviewTimeline
            emptyText=""
            entries={(reviews ?? []).map((r) => ({
              id: r.id as string,
              label: "Review",
              decision: r.decision as string,
              notes: r.notes as string | null,
              created_at: r.created_at as string,
            }))}
          />
        </Card>
      )}

      {editable ? (
        <>
          <ProjectForm project={project} projectDomainIds={(tags ?? []).map((t) => t.domain_id as string)} teams={teams} domains={domains} />
          {project.status === "draft" && (
            <ActionForm action={deleteDraftProject}>
              <input type="hidden" name="project_id" value={id} />
              <SubmitButton variant="ghost" size="sm" className="self-start text-danger" pendingLabel="Deleting…">
                Delete draft
              </SubmitButton>
            </ActionForm>
          )}
        </>
      ) : (
        <p className="text-sm text-muted">This project is {project.status.replaceAll("_", " ")} and can&apos;t be edited right now.</p>
      )}
    </div>
  );
}
