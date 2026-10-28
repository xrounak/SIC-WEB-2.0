import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireManager } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getDomains, getTeams } from "@/lib/data";
import { formatDate, formatDateTime } from "@/lib/format";
import { decideApplication, evaluateApplication, moveApplication, verifyStudent } from "@/lib/actions/recruitment";
import { ActionForm, CheckboxGroup, SelectField, SubmitButton, TextAreaField, TextField } from "@/components/ui/form";
import { Badge, Card, Eyebrow, Meta, Notice, PageHeader, StatusBadge } from "@/components/ui/primitives";
import type { Application, Evaluation, Profile } from "@/lib/types";

export const metadata: Metadata = { title: "Application · Manage" };

const NEXT_STEPS: Record<string, Array<{ status: string; label: string; variant?: "primary" | "secondary" | "danger" }>> = {
  submitted: [{ status: "screening", label: "Start screening" }],
  screening: [
    { status: "shortlisted", label: "Shortlist" },
    { status: "rejected", label: "Reject", variant: "danger" },
  ],
  shortlisted: [
    { status: "interview", label: "Invite to interview" },
    { status: "rejected", label: "Reject", variant: "danger" },
  ],
};

export default async function ApplicationPage({ params }: PageProps<"/manage/recruitment/[id]">) {
  const { id } = await params;
  const viewer = await requireManager();
  const supabase = await createClient();
  const { data } = await supabase.from("recruitment_applications").select("*, recruitment_cycles(name)").eq("id", id).maybeSingle();
  if (!data) notFound();
  const app = data as Application & { recruitment_cycles: { name: string } | null };

  const [{ data: profileRow }, { data: evals }, domains, teams] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", app.user_id).maybeSingle(),
    supabase.from("recruitment_evaluations").select("*").eq("application_id", id).order("created_at"),
    getDomains(),
    getTeams(),
  ]);
  const profile = profileRow as Profile | null;
  const evaluations = (evals ?? []) as Evaluation[];
  const evaluatorIds = [...new Set(evaluations.map((e) => e.evaluator_id).filter(Boolean))] as string[];
  const { data: evaluatorNames } = evaluatorIds.length
    ? await supabase.from("member_directory").select("id, full_name").in("id", evaluatorIds)
    : { data: [] };
  const evaluatorName = new Map((evaluatorNames ?? []).map((n) => [n.id as string, n.full_name as string]));
  const own = app.user_id === viewer.id;
  const canDecide = viewer.isExec && !own && ["shortlisted", "interview", "waitlisted"].includes(app.status);
  const stage = app.status === "interview" ? "interview" : "screening";
  const name = (ids: string[], list: Array<{ id: string; name: string }>) => ids.map((i) => list.find((x) => x.id === i)?.name).filter(Boolean).join(", ");

  return (
    <div className="flex flex-col gap-8">
      <Link href={`/manage/recruitment?cycle=${app.cycle_id}`} className="text-sm text-muted hover:text-fg">
        ← {app.recruitment_cycles?.name ?? "Recruitment"}
      </Link>
      <PageHeader title={profile?.full_name ?? "Applicant"} eyebrow="Application" actions={<StatusBadge status={app.status} />} />
      {own && <Notice tone="warning">This is your own application. You can read it but not review it.</Notice>}

      <div className="grid gap-6 xl:grid-cols-[1fr_22.5rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card className="flex flex-col gap-5 p-5">
            <Meta
              items={[
                { label: "Email", value: profile?.email ?? "—" },
                { label: "Phone", value: profile?.phone ?? "—" },
                { label: "Branch / year", value: `${profile?.branch ?? "—"} · Year ${profile?.academic_year ?? "—"}` },
                { label: "Roll number", value: <span className="font-mono">{profile?.roll_number ?? "—"}</span> },
                { label: "Student status", value: profile ? <StatusBadge status={profile.student_status} /> : "—" },
                { label: "Submitted", value: formatDateTime(app.submitted_at) },
                { label: "Domains", value: name(app.domain_prefs, domains) || "—" },
                { label: "Teams", value: name(app.team_prefs, teams) || "—" },
              ]}
            />
            {profile?.student_status === "pending" && !own && (
              <div className="flex flex-col gap-2 rounded-lg border border-warning/40 bg-warning/5 p-3">
                <p className="text-sm">Check the roll number against the college list, then verify.</p>
                <div className="flex gap-2">
                  <ActionForm action={verifyStudent} className="gap-0">
                    <input type="hidden" name="user_id" value={app.user_id} />
                    <input type="hidden" name="approve" value="yes" />
                    <SubmitButton size="sm" pendingLabel="…">
                      Verify student
                    </SubmitButton>
                  </ActionForm>
                  <ActionForm action={verifyStudent} className="gap-0">
                    <input type="hidden" name="user_id" value={app.user_id} />
                    <input type="hidden" name="approve" value="no" />
                    <SubmitButton size="sm" variant="ghost" pendingLabel="…">
                      Can&apos;t verify
                    </SubmitButton>
                  </ActionForm>
                </div>
              </div>
            )}
          </Card>
          <Card className="flex flex-col gap-5 p-5">
            <section className="flex flex-col gap-1.5">
              <Eyebrow>Why they want to join</Eyebrow>
              <div className="prose-sic text-sm">{app.motivation}</div>
            </section>
            {app.experience && (
              <section className="flex flex-col gap-1.5">
                <Eyebrow>Experience</Eyebrow>
                <div className="prose-sic text-sm">{app.experience}</div>
              </section>
            )}
            {app.portfolio_url && (
              <a href={app.portfolio_url} target="_blank" rel="noreferrer" className="text-sm text-primary">
                {app.portfolio_url} ↗
              </a>
            )}
          </Card>
          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Evaluations</h2>
            <p className="text-[0.8125rem] text-subtle">Private to reviewers. Never shown or emailed to the applicant.</p>
            {evaluations.length === 0 ? (
              <p className="text-sm text-muted">No evaluations yet.</p>
            ) : (
              evaluations.map((e) => (
                <Card key={e.id} className="flex flex-col gap-2 p-4">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-medium">{(e.evaluator_id && evaluatorName.get(e.evaluator_id)) ?? "Reviewer"}</span>
                    <Badge>{e.stage}</Badge>
                    {e.score != null && <Badge tone="accent">{e.score}/10</Badge>}
                    {e.recommendation && <Badge tone={e.recommendation === "reject" ? "danger" : "success"}>{e.recommendation}</Badge>}
                    <span className="text-[0.75rem] text-subtle">{formatDate(e.created_at)}</span>
                  </div>
                  {e.private_notes && <p className="prose-sic text-sm text-muted">{e.private_notes}</p>}
                </Card>
              ))
            )}
          </section>
        </div>

        <aside className="flex flex-col gap-4">
          {!own && NEXT_STEPS[app.status] && (
            <Card className="flex flex-col gap-3 p-5">
              <h2 className="text-lg font-semibold">Move</h2>
              <div className="flex flex-wrap gap-2">
                {NEXT_STEPS[app.status].map((s) => (
                  <ActionForm key={s.status} action={moveApplication} className="gap-0">
                    <input type="hidden" name="application_id" value={id} />
                    <input type="hidden" name="status" value={s.status} />
                    <SubmitButton size="sm" variant={s.variant ?? "primary"} pendingLabel="…">
                      {s.label}
                    </SubmitButton>
                  </ActionForm>
                ))}
              </div>
            </Card>
          )}
          {!own && ["submitted", "screening", "shortlisted", "interview"].includes(app.status) && (
            <Card className="p-5">
              <h2 className="mb-4 text-lg font-semibold">Your evaluation</h2>
              <ActionForm action={evaluateApplication}>
                <input type="hidden" name="application_id" value={id} />
                <input type="hidden" name="stage" value={stage} />
                <div className="grid grid-cols-2 gap-3">
                  <TextField name="score" label="Score" type="number" min={0} max={10} step={0.5} required={false} />
                  <SelectField
                    name="recommendation"
                    label="Recommend"
                    options={[
                      { value: "advance", label: "Advance" },
                      { value: "hold", label: "Hold" },
                      { value: "select", label: "Select" },
                      { value: "reject", label: "Reject" },
                    ]}
                  />
                </div>
                <TextAreaField name="private_notes" label="Private notes" required={false} rows={4} />
                <SubmitButton variant="secondary" className="self-start">
                  Save evaluation
                </SubmitButton>
              </ActionForm>
            </Card>
          )}
          {canDecide && (
            <Card className="p-5">
              <h2 className="mb-1 text-lg font-semibold">Final decision</h2>
              <p className="mb-4 text-[0.8125rem] text-muted">Selecting grants membership and adds them to the chosen domains and teams.</p>
              <ActionForm action={decideApplication}>
                <input type="hidden" name="application_id" value={id} />
                <CheckboxGroup name="domains" label="Domains" required={false} defaultValues={app.domain_prefs} options={domains.map((d) => ({ value: d.id, label: d.name }))} />
                <CheckboxGroup name="teams" label="Teams" required={false} defaultValues={app.team_prefs} options={teams.map((t) => ({ value: t.id, label: t.name }))} />
                <div className="flex flex-wrap gap-2">
                  <SubmitButton name="decision" value="selected" pendingLabel="…">
                    Select
                  </SubmitButton>
                  <SubmitButton name="decision" value="waitlisted" variant="secondary" pendingLabel="…">
                    Waitlist
                  </SubmitButton>
                  <SubmitButton name="decision" value="rejected" variant="danger" pendingLabel="…">
                    Reject
                  </SubmitButton>
                </div>
              </ActionForm>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}
