import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireManager } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ROLE_LABEL, formatDate } from "@/lib/format";
import { roleAction } from "@/lib/actions/manage";
import { ActionForm, SelectField, SubmitButton, TextField } from "@/components/ui/form";
import { Card, PageHeader, Table } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Roles · Manage" };

const ROLE_OPTIONS = Object.entries(ROLE_LABEL).map(([value, label]) => ({ value, label }));

export default async function RolesPage() {
  const viewer = await requireManager();
  if (!viewer.isAdmin) redirect("/manage");
  const supabase = await createClient();
  const { data: roles } = await supabase.from("user_roles").select("user_id, role, created_at").order("role");
  const ids = [...new Set((roles ?? []).map((r) => r.user_id as string))];
  const { data: people } = ids.length ? await supabase.from("profiles").select("id, full_name, email").in("id", ids) : { data: [] };
  const person = new Map((people ?? []).map((p) => [p.id as string, p as { full_name: string; email: string }]));

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Admin"
        title="Roles"
        description="Office-bearer and admin roles. Admin is a technical role; it doesn't give a vote in club decisions. Every change is in the audit log."
      />
      <Card className="p-5">
        <h2 className="mb-4 text-lg font-semibold">Assign a role</h2>
        <ActionForm action={roleAction}>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField name="email" label="Account email" type="email" hint="They must have signed in at least once." />
            <SelectField name="role" label="Role" options={ROLE_OPTIONS} defaultValue="vice_president" />
          </div>
          <SubmitButton name="intent" value="assign" className="self-start">
            Assign role
          </SubmitButton>
        </ActionForm>
      </Card>
      <Table head={["Person", "Role", "Since", ""]}>
        {(roles ?? []).map((r) => {
          const p = person.get(r.user_id as string);
          return (
            <tr key={`${r.user_id}-${r.role}`}>
              <td>
                <span className="block font-medium">{p?.full_name ?? "—"}</span>
                <span className="block text-[0.75rem] text-subtle">{p?.email}</span>
              </td>
              <td>{ROLE_LABEL[r.role as string]}</td>
              <td className="text-muted">{formatDate(r.created_at as string)}</td>
              <td className="text-right">
                <ActionForm action={roleAction} className="gap-1">
                  <input type="hidden" name="user_id" value={r.user_id as string} />
                  <input type="hidden" name="role" value={r.role as string} />
                  <SubmitButton size="sm" variant="ghost" name="intent" value="revoke" pendingLabel="…">
                    Remove
                  </SubmitButton>
                </ActionForm>
              </td>
            </tr>
          );
        })}
      </Table>
    </div>
  );
}
