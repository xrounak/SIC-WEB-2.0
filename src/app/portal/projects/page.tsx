import type { Metadata } from "next";
import Link from "next/link";
import { requireMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { confirmContribution } from "@/lib/actions/projects";
import { ButtonLink } from "@/components/ui/button";
import { ActionForm, SubmitButton } from "@/components/ui/form";
import { Card, EmptyState, Notice, PageHeader, StatusBadge, Table } from "@/components/ui/primitives";
import { QueryNotice } from "@/components/query-notice";
import type { Project } from "@/lib/types";

export const metadata: Metadata = { title: "Projects" };

export default async function MyProjectsPage({ searchParams }: PageProps<"/portal/projects">) {
  const viewer = await requireMember();
  const supabase = await createClient();
  const [{ data: mine }, { data: credits }] = await Promise.all([
    supabase.from("projects").select("*").eq("created_by", viewer.id).order("updated_at", { ascending: false }),
    supabase
      .from("project_contributors")
      .select("project_id, contribution, confirmed_at, is_public, projects(title, slug, status, created_by)")
      .eq("member_id", viewer.id),
  ]);
  const projects = (mine ?? []) as Project[];
  const others = ((credits ?? []) as unknown as Array<{
    project_id: string;
    contribution: string | null;
    confirmed_at: string | null;
    is_public: boolean;
    projects: { title: string; slug: string | null; status: string; created_by: string } | null;
  }>).filter((c) => c.projects?.created_by !== viewer.id);
  const pending = others.filter((c) => !c.confirmed_at);

  return (
    <div className="flex flex-col gap-8">
      <QueryNotice searchParams={searchParams} />
      <PageHeader
        title="Projects"
        description="Projects you've submitted and ones you're credited on."
        actions={<ButtonLink href="/portal/projects/new">Submit a project</ButtonLink>}
      />

      {pending.length > 0 && (
        <section className="flex flex-col gap-3">
          <Notice tone="accent" title="Confirm your credit">
            You&apos;ve been listed on these projects. Your name only appears publicly after you confirm.
          </Notice>
          {pending.map((c) => (
            <Card key={c.project_id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col">
                <span className="font-medium">{c.projects?.title}</span>
                {c.contribution && <span className="text-[0.8125rem] text-muted">Listed as: {c.contribution}</span>}
              </div>
              <ActionForm action={confirmContribution} className="flex-row flex-wrap items-center gap-2">
                <input type="hidden" name="project_id" value={c.project_id} />
                <label className="flex items-center gap-2 text-[0.8125rem] text-muted">
                  <input type="checkbox" name="is_public" value="on" defaultChecked className="accent-[var(--color-primary)]" />
                  Show my name publicly
                </label>
                <SubmitButton size="sm" name="decision" value="accept">
                  Confirm
                </SubmitButton>
                <SubmitButton size="sm" variant="ghost" name="decision" value="decline">
                  Not me
                </SubmitButton>
              </ActionForm>
            </Card>
          ))}
        </section>
      )}

      {projects.length === 0 ? (
        <EmptyState title="You haven't submitted a project yet" description="Built something with your team? Show it off." />
      ) : (
        <Table head={["Project", "Updated", "Status"]}>
          {projects.map((p) => (
            <tr key={p.id}>
              <td>
                <Link href={`/portal/projects/${p.id}/edit`} className="font-medium hover:text-primary">
                  {p.title}
                </Link>
              </td>
              <td className="text-muted">{formatDate(p.created_at)}</td>
              <td>
                <StatusBadge status={p.status} />
              </td>
            </tr>
          ))}
        </Table>
      )}

      {others.filter((c) => c.confirmed_at).length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Credited on</h2>
          <ul className="flex flex-wrap gap-2">
            {others
              .filter((c) => c.confirmed_at)
              .map((c) => (
                <li key={c.project_id}>
                  {c.projects?.slug && c.projects.status === "published" ? (
                    <Link href={`/projects/${c.projects.slug}`} className="rounded-lg border border-line px-3 py-1.5 text-sm hover:text-primary">
                      {c.projects.title}
                    </Link>
                  ) : (
                    <span className="rounded-lg border border-line px-3 py-1.5 text-sm text-muted">{c.projects?.title}</span>
                  )}
                </li>
              ))}
          </ul>
        </section>
      )}
    </div>
  );
}
