import type { Metadata } from "next";
import Link from "next/link";
import { requireManager } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { verifyStudent } from "@/lib/actions/recruitment";
import { cn } from "@/lib/cn";
import { ActionForm, SubmitButton, inputClass } from "@/components/ui/form";
import { buttonClass } from "@/components/ui/button";
import { EmptyState, PageHeader, StatusBadge, Table } from "@/components/ui/primitives";
import type { Profile } from "@/lib/types";

export const metadata: Metadata = { title: "Members · Manage" };

export default async function MembersPage({ searchParams }: PageProps<"/manage/members">) {
  const viewer = await requireManager();
  const { tab, q } = await searchParams;
  const active = tab === "verify" ? "verify" : "directory";
  const query = typeof q === "string" ? q.trim().slice(0, 60) : "";
  const supabase = await createClient();

  let rows: Profile[] = [];
  if (active === "verify") {
    const { data } = await supabase.from("profiles").select("*").eq("student_status", "pending").neq("id", viewer.id).order("updated_at").limit(100);
    rows = (data ?? []) as Profile[];
  } else {
    let req = supabase.from("profiles").select("*").in("member_status", ["member", "applicant", "alumni", "suspended"]).order("full_name").limit(200);
    if (query) req = req.ilike("full_name", `%${query.replaceAll("%", "")}%`);
    const { data } = await req;
    rows = (data ?? []) as Profile[];
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Manage"
        title="Members"
        description={viewer.isStaff ? "Everyone in the club." : "Members of the teams you lead, and students waiting for verification."}
      />
      <nav aria-label="View" className="flex flex-wrap gap-2">
        {[
          { key: "directory", label: "Directory" },
          { key: "verify", label: "Student verification" },
        ].map((t) => (
          <Link
            key={t.key}
            href={`/manage/members?tab=${t.key}`}
            aria-current={active === t.key ? "page" : undefined}
            className={cn(
              "rounded-full border px-3 py-1 text-[0.8125rem]",
              active === t.key ? "border-primary bg-primary/10 text-primary" : "border-line-strong text-muted hover:text-fg",
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {active === "directory" && (
        <form className="flex gap-2" role="search">
          <input type="hidden" name="tab" value="directory" />
          <label htmlFor="member-q" className="sr-only">
            Search by name
          </label>
          <input id="member-q" name="q" defaultValue={query} placeholder="Search by name" className={cn(inputClass, "max-w-sm")} />
          <button type="submit" className={buttonClass("secondary")}>
            Search
          </button>
        </form>
      )}

      {rows.length === 0 ? (
        <EmptyState title={active === "verify" ? "No students waiting for verification" : "No members found"} />
      ) : active === "verify" ? (
        <Table head={["Student", "Roll number", "Branch / year", "Since", ""]}>
          {rows.map((p) => (
            <tr key={p.id}>
              <td>
                <span className="block font-medium">{p.full_name}</span>
                <span className="block text-[0.75rem] text-subtle">{p.email}</span>
              </td>
              <td className="font-mono text-[0.8125rem]">{p.roll_number}</td>
              <td className="text-muted">
                {p.branch} · Y{p.academic_year}
              </td>
              <td className="text-muted">{formatDate(p.created_at)}</td>
              <td>
                <div className="flex justify-end gap-1">
                  <ActionForm action={verifyStudent} hideMessages className="gap-0">
                    <input type="hidden" name="user_id" value={p.id} />
                    <input type="hidden" name="approve" value="yes" />
                    <SubmitButton size="sm" pendingLabel="…">
                      Verify
                    </SubmitButton>
                  </ActionForm>
                  <ActionForm action={verifyStudent} hideMessages className="gap-0">
                    <input type="hidden" name="user_id" value={p.id} />
                    <input type="hidden" name="approve" value="no" />
                    <SubmitButton size="sm" variant="ghost" pendingLabel="…">
                      Reject
                    </SubmitButton>
                  </ActionForm>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      ) : (
        <Table head={["Name", "Contact", "Branch / year", "Membership", "Student"]}>
          {rows.map((p) => (
            <tr key={p.id}>
              <td className="font-medium">{p.full_name}</td>
              <td className="text-[0.8125rem] text-muted">
                <span className="block">{p.email}</span>
                <span className="block">{p.phone}</span>
              </td>
              <td className="text-muted">
                {p.branch ?? "—"}
                {p.academic_year ? ` · Y${p.academic_year}` : ""}
              </td>
              <td>
                <StatusBadge status={p.member_status} />
              </td>
              <td>
                <StatusBadge status={p.student_status} />
              </td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
