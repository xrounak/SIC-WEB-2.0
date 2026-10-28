import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireManager } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";
import { EmptyState, PageHeader, Table } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Audit log · Manage" };

export default async function AuditPage() {
  const viewer = await requireManager();
  if (!viewer.isAdmin && !viewer.roles.includes("president")) redirect("/manage");
  const supabase = await createClient();
  const { data: logs } = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(200);
  const ids = [...new Set((logs ?? []).map((l) => l.actor_id).filter(Boolean))] as string[];
  const { data: people } = ids.length ? await supabase.from("profiles").select("id, full_name").in("id", ids) : { data: [] };
  const nameOf = new Map((people ?? []).map((p) => [p.id as string, p.full_name as string]));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Manage" title="Audit log" description="Approvals, role changes, verifications and other sensitive actions. Latest 200 entries." />
      {(logs ?? []).length === 0 ? (
        <EmptyState title="No entries yet" />
      ) : (
        <Table head={["When", "Who", "Action", "Details"]}>
          {(logs ?? []).map((l) => (
            <tr key={l.id}>
              <td className="whitespace-nowrap text-[0.8125rem] text-muted">{formatDateTime(l.created_at)}</td>
              <td>{(l.actor_id && nameOf.get(l.actor_id)) ?? "System"}</td>
              <td className="font-mono text-[0.75rem] text-primary">{l.action}</td>
              <td className="max-w-xs truncate font-mono text-[0.75rem] text-subtle">
                {l.entity_type} {Object.keys(l.metadata ?? {}).length ? JSON.stringify(l.metadata) : ""}
              </td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
