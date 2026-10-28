import type { Metadata } from "next";
import Link from "next/link";
import { requireMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EVENT_TYPE_LABEL, formatDateTime } from "@/lib/format";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, PageHeader, StatusBadge, Table } from "@/components/ui/primitives";
import { QueryNotice } from "@/components/query-notice";
import type { SicEvent } from "@/lib/types";

export const metadata: Metadata = { title: "Event proposals" };

export default async function ProposalsPage({ searchParams }: PageProps<"/portal/proposals">) {
  const viewer = await requireMember();
  const supabase = await createClient();
  const { data } = await supabase.from("events").select("*").eq("created_by", viewer.id).order("updated_at", { ascending: false });
  const events = (data ?? []) as SicEvent[];

  return (
    <div className="flex flex-col gap-8">
      <QueryNotice searchParams={searchParams} />
      <PageHeader
        title="Event proposals"
        description="Events you've proposed. The organising team's lead reviews each one; major events also need the VP or President."
        actions={<ButtonLink href="/portal/proposals/new">Propose an event</ButtonLink>}
      />
      {events.length === 0 ? (
        <EmptyState title="No proposals yet" description="Have an idea for a workshop, talk or competition? Propose it." />
      ) : (
        <Table head={["Event", "Type", "Starts", "Status"]}>
          {events.map((e) => (
            <tr key={e.id}>
              <td>
                <Link href={`/portal/proposals/${e.id}`} className="font-medium hover:text-primary">
                  {e.title}
                </Link>
              </td>
              <td className="text-muted">{EVENT_TYPE_LABEL[e.event_type]}</td>
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
