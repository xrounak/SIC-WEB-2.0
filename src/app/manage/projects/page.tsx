import type { Metadata } from "next";
import Link from "next/link";
import { requireManager } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getTeams } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";
import { EmptyState, PageHeader, StatusBadge, Table } from "@/components/ui/primitives";
import type { Project } from "@/lib/types";

export const metadata: Metadata = { title: "Projects · Manage" };

const FILTERS = [
  { key: "queue", label: "Needs review", statuses: ["submitted", "in_review"] },
  { key: "published", label: "Published", statuses: ["published"] },
  { key: "other", label: "Drafts & closed", statuses: ["draft", "changes_requested", "rejected", "archived"] },
];

export default async function ManageProjectsPage({ searchParams }: PageProps<"/manage/projects">) {
  await requireManager();
  const { f } = await searchParams;
  const filter = FILTERS.find((x) => x.key === f) ?? FILTERS[0];
  const supabase = await createClient();
  const [{ data }, teams] = await Promise.all([
    supabase.from("projects").select("*").in("status", filter.statuses).order("updated_at", { ascending: false }).limit(100),
    getTeams(),
  ]);
  const projects = (data ?? []) as Project[];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Manage" title="Projects" description="Review member projects before they appear in the public gallery." />
      <nav aria-label="Filter" className="flex flex-wrap gap-2">
        {FILTERS.map((x) => (
          <Link
            key={x.key}
            href={`/manage/projects?f=${x.key}`}
            aria-current={x.key === filter.key ? "page" : undefined}
            className={cn(
              "rounded-full border px-3 py-1 text-[0.8125rem]",
              x.key === filter.key ? "border-primary bg-primary/10 text-primary" : "border-line-strong text-muted hover:text-fg",
            )}
          >
            {x.label}
          </Link>
        ))}
      </nav>
      {projects.length === 0 ? (
        <EmptyState title="Nothing here" />
      ) : (
        <Table head={["Project", "Team", "Created", "Status"]}>
          {projects.map((p) => (
            <tr key={p.id}>
              <td>
                <Link href={`/manage/projects/${p.id}`} className="font-medium hover:text-primary">
                  {p.title}
                </Link>
              </td>
              <td className="text-muted">{teams.find((t) => t.id === p.owner_team_id)?.name}</td>
              <td className="text-muted">{formatDate(p.created_at)}</td>
              <td>
                <StatusBadge status={p.status} />
              </td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
