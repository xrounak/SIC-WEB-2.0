import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireManager } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { reviewProject } from "@/lib/actions/projects";
import { ActionForm, SubmitButton, TextAreaField } from "@/components/ui/form";
import { buttonClass } from "@/components/ui/button";
import { Card, Eyebrow, Notice, PageHeader, StatusBadge } from "@/components/ui/primitives";
import { ReviewTimeline } from "@/components/review-timeline";
import type { Project } from "@/lib/types";

export const metadata: Metadata = { title: "Project · Manage" };

export default async function ManageProjectPage({ params }: PageProps<"/manage/projects/[id]">) {
  const { id } = await params;
  const viewer = await requireManager();
  const supabase = await createClient();
  const { data } = await supabase.from("projects").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const project = data as Project;

  const [{ data: contributors }, { data: reviews }, { data: author }] = await Promise.all([
    supabase.from("project_contributors").select("member_id, contribution, confirmed_at, is_public").eq("project_id", id),
    supabase.from("project_reviews").select("*").eq("project_id", id).order("created_at"),
    supabase.from("profiles").select("full_name, email").eq("id", project.created_by).maybeSingle(),
  ]);
  const ids = (contributors ?? []).map((c) => c.member_id as string);
  const { data: names } = ids.length ? await supabase.from("member_directory").select("id, full_name").in("id", ids) : { data: [] };
  const nameOf = new Map((names ?? []).map((n) => [n.id as string, n.full_name as string]));

  const own = project.created_by === viewer.id;
  const canReview = ["submitted", "in_review"].includes(project.status) && !own;
  const sections = [
    ["Summary", project.summary],
    ["Problem", project.problem],
    ["Solution", project.solution],
    ["Hardware", project.hardware_details],
    ["Software", project.software_details],
    ["Outcomes", project.outcomes],
  ].filter(([, v]) => v) as Array<[string, string]>;

  return (
    <div className="flex flex-col gap-8">
      <Link href="/manage/projects" className="text-sm text-muted hover:text-fg">
        ← Projects
      </Link>
      <PageHeader title={project.title} description={author ? `By ${author.full_name}` : undefined} actions={<StatusBadge status={project.status} />} />

      <div className="grid gap-6 xl:grid-cols-[1fr_21.25rem]">
        <Card className="flex min-w-0 flex-col gap-6 p-5">
          {sections.map(([title, body]) => (
            <section key={title} className="flex flex-col gap-1.5">
              <Eyebrow>{title}</Eyebrow>
              <div className="prose-sic text-sm">{body}</div>
            </section>
          ))}
          <div className="flex flex-wrap gap-2">
            {project.repo_url && (
              <a href={project.repo_url} target="_blank" rel="noreferrer" className={buttonClass("secondary", "sm")}>
                Source ↗
              </a>
            )}
            {project.demo_url && (
              <a href={project.demo_url} target="_blank" rel="noreferrer" className={buttonClass("secondary", "sm")}>
                Demo ↗
              </a>
            )}
          </div>
          <section className="flex flex-col gap-2">
            <Eyebrow>Contributors</Eyebrow>
            <ul className="flex flex-col gap-1.5 text-sm">
              {(contributors ?? []).map((c) => (
                <li key={c.member_id} className="flex flex-wrap items-center gap-2">
                  <span>{nameOf.get(c.member_id as string) ?? "Member"}</span>
                  {c.contribution && <span className="text-subtle">· {c.contribution}</span>}
                  <StatusBadge status={c.confirmed_at ? "accepted" : "pending"} />
                </li>
              ))}
            </ul>
          </section>
        </Card>

        <aside className="flex flex-col gap-4">
          {canReview && (
            <Card className="p-5">
              <h2 className="mb-1 text-lg font-semibold">Review</h2>
              <p className="mb-4 text-[0.8125rem] text-muted">Check claims, safety and media rights. Approving publishes it to the gallery.</p>
              <ActionForm action={reviewProject}>
                <input type="hidden" name="project_id" value={id} />
                <TextAreaField name="notes" label="Notes for the author" required={false} rows={3} hint="Required when requesting changes or rejecting." />
                <div className="flex flex-wrap gap-2">
                  <SubmitButton name="decision" value="approved" pendingLabel="…">
                    Approve and publish
                  </SubmitButton>
                  <SubmitButton name="decision" value="changes_requested" variant="secondary" pendingLabel="…">
                    Request changes
                  </SubmitButton>
                  <SubmitButton name="decision" value="rejected" variant="danger" pendingLabel="…">
                    Reject
                  </SubmitButton>
                  {project.status === "submitted" && (
                    <SubmitButton name="decision" value="start" variant="ghost" pendingLabel="…">
                      Mark in review
                    </SubmitButton>
                  )}
                </div>
              </ActionForm>
            </Card>
          )}
          {own && canReview === false && ["submitted", "in_review"].includes(project.status) && (
            <Notice tone="neutral">You submitted this project, so someone else reviews it.</Notice>
          )}
          {project.status === "published" && project.slug && (
            <Link href={`/projects/${project.slug}`} className={buttonClass("secondary")}>
              View public page ↗
            </Link>
          )}
          <Card className="p-5">
            <h2 className="mb-4 text-lg font-semibold">Review history</h2>
            <ReviewTimeline
              emptyText="No decisions yet."
              entries={(reviews ?? []).map((r) => ({
                id: r.id as string,
                label: "Review",
                decision: r.decision as string,
                notes: r.notes as string | null,
                created_at: r.created_at as string,
              }))}
            />
          </Card>
        </aside>
      </div>
    </div>
  );
}
