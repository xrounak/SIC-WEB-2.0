import type { Metadata } from "next";
import { requireOnboarded } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { withdrawApplication } from "@/lib/actions/recruitment";
import { ActionForm, SubmitButton } from "@/components/ui/form";
import { ButtonLink } from "@/components/ui/button";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui/primitives";
import { QueryNotice } from "@/components/query-notice";

export const metadata: Metadata = { title: "Applications" };

// Applicants see a simpler pipeline than reviewers.
const APPLICANT_STATUS: Record<string, { label: string; tone: "neutral" | "accent" | "success" | "warning" | "danger"; help: string }> = {
  submitted: { label: "Received", tone: "accent", help: "We have your application. Reviewers will look at it soon." },
  screening: { label: "Under review", tone: "accent", help: "Reviewers are reading applications and confirming student details." },
  shortlisted: { label: "Under review", tone: "accent", help: "Reviewers are reading applications and confirming student details." },
  interview: { label: "Interview", tone: "warning", help: "You've been invited to interview. Watch your email for the time and place." },
  selected: { label: "Selected", tone: "success", help: "Welcome to SIC. Member features are now open in your portal." },
  waitlisted: { label: "Waitlisted", tone: "warning", help: "We'll be in touch if a place opens up." },
  rejected: { label: "Not selected", tone: "neutral", help: "Thanks for applying. You're welcome to apply again next cycle." },
  withdrawn: { label: "Withdrawn", tone: "neutral", help: "You withdrew this application." },
};

export default async function ApplicationsPage({ searchParams }: PageProps<"/portal/applications">) {
  const viewer = await requireOnboarded();
  const supabase = await createClient();
  const { data } = await supabase
    .from("recruitment_applications")
    .select("id, status, submitted_at, decided_at, recruitment_cycles(name)")
    .eq("user_id", viewer.id)
    .order("submitted_at", { ascending: false });
  const apps = (data ?? []) as unknown as Array<{ id: string; status: string; submitted_at: string; recruitment_cycles: { name: string } | null }>;

  return (
    <div className="flex flex-col gap-8">
      <QueryNotice searchParams={searchParams} />
      <PageHeader title="Applications" description="Your membership applications and where they stand." />
      {apps.length === 0 ? (
        <EmptyState title="You haven't applied yet" action={<ButtonLink href="/join" size="sm">See how to join</ButtonLink>} />
      ) : (
        <ul className="flex flex-col gap-3">
          {apps.map((a) => {
            const s = APPLICANT_STATUS[a.status];
            const open = !["selected", "rejected", "withdrawn"].includes(a.status);
            return (
              <li key={a.id}>
                <Card className="flex flex-col gap-3 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-medium">{a.recruitment_cycles?.name ?? "Recruitment"}</p>
                    <Badge tone={s.tone}>{s.label}</Badge>
                  </div>
                  <p className="text-sm text-muted">{s.help}</p>
                  <p className="text-[0.8125rem] text-subtle">Submitted {formatDate(a.submitted_at)}</p>
                  {open && (
                    <ActionForm action={withdrawApplication}>
                      <input type="hidden" name="application_id" value={a.id} />
                      <SubmitButton variant="ghost" size="sm" className="self-start" pendingLabel="Withdrawing…">
                        Withdraw application
                      </SubmitButton>
                    </ActionForm>
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
