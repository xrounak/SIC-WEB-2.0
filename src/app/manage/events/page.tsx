import type { Metadata } from "next";
import Link from "next/link";
import { requireManager } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getTeams } from "@/lib/data";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Badge, EmptyState, PageHeader, StatusBadge, Table } from "@/components/ui/primitives";
import type { EventStatus, SicEvent } from "@/lib/types";

export const metadata: Metadata = { title: "Events · Manage" };

const FILTERS: Array<{ key: string; label: string; statuses: EventStatus[] }> = [
  { key: "queue", label: "Needs action", statuses: ["pending_review", "lead_approved", "final_approved"] },
  { key: "live", label: "Live", statuses: ["published"] },
  { key: "drafts", label: "Drafts & changes", statuses: ["draft", "changes_requested"] },
  { key: "past", label: "Past", statuses: ["completed", "cancelled", "rejected", "archived"] },
];

export default async function ManageEventsPage({ searchParams }: PageProps<"/manage/events">) {
  await requireManager();
  const { f } = await searchParams;
  const filter = FILTERS.find((x) => x.key === f) ?? FILTERS[0];
  const supabase = await createClient();
  const [{ data }, teams] = await Promise.all([
    supabase.from("events").select("*").in("status", filter.statuses).order("starts_at", { ascending: filter.key !== "past" }).limit(100),
    getTeams(),
  ]);
  const events = (data ?? []) as SicEvent[];
  const teamName = (id: string) => teams.find((t) => t.id === id)?.name ?? "—";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Manage" title="Events" description="Events in your scope. Leads see their teams' events; the VP and President see all." />
      <nav aria-label="Filter" className="flex flex-wrap gap-2">
        {FILTERS.map((x) => (
          <Link
            key={x.key}
            href={`/manage/events?f=${x.key}`}
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
      {events.length === 0 ? (
        <EmptyState title="Nothing here" />
      ) : (
        <Table head={["Event", "Team", "Starts", "Status"]}>
          {events.map((e) => (
            <tr key={e.id}>
              <td>
                <Link href={`/manage/events/${e.id}`} className="font-medium hover:text-primary">
                  {e.title}
                </Link>
                {e.is_major && <Badge tone="warning" className="ml-2">Major</Badge>}
              </td>
              <td className="text-muted">{teamName(e.owner_team_id)}</td>
              <td className="whitespace-nowrap text-muted">{formatDateTime(e.starts_at)}</td>
              <td>
                <StatusBadge status={e.status} />
              </td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
