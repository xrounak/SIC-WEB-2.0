import type { Metadata } from "next";
import Link from "next/link";
import { requireManager } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate, toLocalInput } from "@/lib/format";
import { saveCycle, setCycleReviewer } from "@/lib/actions/recruitment";
import { cn } from "@/lib/cn";
import { ActionForm, SelectField, SubmitButton, TextAreaField, TextField } from "@/components/ui/form";
import { Card, EmptyState, PageHeader, StatusBadge } from "@/components/ui/primitives";
import { MemberSelect } from "@/components/forms/member-select";
import type { RecruitmentCycle } from "@/lib/types";

export const metadata: Metadata = { title: "Recruitment · Manage" };

const COLUMNS = [
  { key: "submitted", label: "Submitted" },
  { key: "screening", label: "Screening" },
  { key: "shortlisted", label: "Shortlisted" },
  { key: "interview", label: "Interview" },
  { key: "decided", label: "Decided" },
];

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft (hidden)" },
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
  { value: "archived", label: "Archived" },
];

export default async function RecruitmentPage({ searchParams }: PageProps<"/manage/recruitment">) {
  const viewer = await requireManager();
  const { cycle: cycleParam, edit } = await searchParams;
  const supabase = await createClient();
  const { data: cyclesData } = await supabase.from("recruitment_cycles").select("*").order("opens_at", { ascending: false });
  const cycles = (cyclesData ?? []) as RecruitmentCycle[];
  const cycle = cycles.find((c) => c.id === cycleParam) ?? cycles[0];

  type AppRow = { id: string; status: string; submitted_at: string; user_id: string };
  let apps: AppRow[] = [];
  const names = new Map<string, { full_name: string; branch: string | null; student_status: string }>();
  if (cycle) {
    const { data } = await supabase.from("recruitment_applications").select("id, status, submitted_at, user_id").eq("cycle_id", cycle.id).order("submitted_at");
    apps = (data ?? []) as AppRow[];
    const ids = apps.map((a) => a.user_id);
    if (ids.length) {
      const { data: profiles } = await supabase.from("profiles").select("id, full_name, branch, student_status").in("id", ids);
      (profiles ?? []).forEach((p) => names.set(p.id as string, p as { full_name: string; branch: string | null; student_status: string }));
    }
  }
  let reviewers: Array<{ user_id: string; name: string }> = [];
  if (cycle && viewer.isExec) {
    const { data: rv } = await supabase.from("recruitment_reviewers").select("user_id").eq("cycle_id", cycle.id);
    const rIds = (rv ?? []).map((r) => r.user_id as string);
    const { data: rNames } = rIds.length ? await supabase.from("profiles").select("id, full_name").in("id", rIds) : { data: [] };
    reviewers = rIds.map((uid) => ({ user_id: uid, name: (rNames ?? []).find((n) => n.id === uid)?.full_name ?? "Member" }));
  }
  const editing = edit === "new" ? undefined : cycles.find((c) => c.id === edit);
  const showForm = viewer.isExec && (edit === "new" || editing);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Manage"
        title="Recruitment"
        description="Reviewers move applications through screening and interviews. The VP or President makes final decisions."
        actions={viewer.isExec && <Link href="/manage/recruitment?edit=new" className="text-sm text-primary">+ New cycle</Link>}
      />

      {showForm && (
        <Card className="p-5">
          <h2 className="mb-4 text-lg font-semibold">{editing ? `Edit ${editing.name}` : "New recruitment cycle"}</h2>
          <ActionForm action={saveCycle}>
            {editing && <input type="hidden" name="cycle_id" value={editing.id} />}
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField name="name" label="Name" defaultValue={editing?.name} placeholder="Fall 2026" />
              <SelectField name="status" label="Status" options={STATUS_OPTIONS} defaultValue={editing?.status ?? "draft"} />
              <TextField name="opens_at" label="Opens" type="datetime-local" defaultValue={toLocalInput(editing?.opens_at)} />
              <TextField name="closes_at" label="Closes" type="datetime-local" defaultValue={toLocalInput(editing?.closes_at)} />
            </div>
            <TextAreaField name="description" label="Description" required={false} rows={3} defaultValue={editing?.description} />
            <SubmitButton className="self-start">Save cycle</SubmitButton>
          </ActionForm>
        </Card>
      )}

      {cycles.length === 0 ? (
        <EmptyState title="No recruitment cycles yet" description={viewer.isExec ? "Create one to start accepting applications." : "The VP or President creates cycles."} />
      ) : (
        <>
          <nav aria-label="Cycles" className="flex flex-wrap items-center gap-2">
            {cycles.map((c) => (
              <Link
                key={c.id}
                href={`/manage/recruitment?cycle=${c.id}`}
                aria-current={c.id === cycle?.id ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-1 text-[0.8125rem]",
                  c.id === cycle?.id ? "border-primary bg-primary/10 text-primary" : "border-line-strong text-muted hover:text-fg",
                )}
              >
                {c.name} <StatusBadge status={c.status} />
              </Link>
            ))}
          </nav>
          {cycle && (
            <p className="text-sm text-muted">
              {formatDate(cycle.opens_at)} – {formatDate(cycle.closes_at)} · {apps.length} application{apps.length === 1 ? "" : "s"}
              {viewer.isExec && (
                <>
                  {" · "}
                  <Link href={`/manage/recruitment?cycle=${cycle.id}&edit=${cycle.id}`} className="text-primary">
                    Edit cycle
                  </Link>
                </>
              )}
            </p>
          )}

          {cycle && viewer.isExec && (
            <Card className="flex flex-col gap-3 p-5">
              <h2 className="text-lg font-semibold">Reviewers for {cycle.name}</h2>
              <p className="text-[0.8125rem] text-muted">Reviewers can screen, interview and evaluate. The VP and President always can.</p>
              <ul className="flex flex-wrap gap-2">
                {reviewers.length === 0 && <li className="text-sm text-muted">None assigned.</li>}
                {reviewers.map((r) => (
                  <li key={r.user_id} className="flex items-center gap-1 rounded-lg border border-line py-0.5 pl-2.5 text-[0.8125rem]">
                    {r.name}
                    <ActionForm action={setCycleReviewer} hideMessages className="gap-0">
                      <input type="hidden" name="cycle_id" value={cycle.id} />
                      <input type="hidden" name="user_id" value={r.user_id} />
                      <SubmitButton size="sm" variant="ghost" name="intent" value="remove" pendingLabel="…">
                        Remove
                      </SubmitButton>
                    </ActionForm>
                  </li>
                ))}
              </ul>
              <ActionForm action={setCycleReviewer}>
                <input type="hidden" name="cycle_id" value={cycle.id} />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <MemberSelect label="Add reviewer" />
                  <SubmitButton variant="secondary" name="intent" value="add" pendingLabel="…">
                    Add
                  </SubmitButton>
                </div>
              </ActionForm>
            </Card>
          )}

          <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
            <div className="grid min-w-[56.25rem] grid-cols-5 gap-3">
              {COLUMNS.map((col) => {
                const list = apps.filter((a) =>
                  col.key === "decided" ? ["selected", "waitlisted", "rejected", "withdrawn"].includes(a.status) : a.status === col.key,
                );
                return (
                  <div key={col.key} className="flex flex-col gap-2 rounded-xl border border-line bg-surface-2/40 p-2">
                    <p className="flex items-center justify-between px-2 py-1 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-subtle">
                      {col.label} <span className="tabular">{list.length}</span>
                    </p>
                    {list.map((a) => {
                      const p = names.get(a.user_id);
                      return (
                        <Link
                          key={a.id}
                          href={`/manage/recruitment/${a.id}`}
                          className="flex flex-col gap-1 rounded-lg border border-line bg-surface p-3 text-sm transition-colors hover:border-primary/50"
                        >
                          <span className="truncate font-medium">{p?.full_name ?? "Applicant"}</span>
                          <span className="truncate text-[0.75rem] text-subtle">{p?.branch}</span>
                          <span className="flex flex-wrap gap-1">
                            {col.key === "decided" && <StatusBadge status={a.status} />}
                            {p?.student_status === "pending" && <StatusBadge status="pending" />}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
