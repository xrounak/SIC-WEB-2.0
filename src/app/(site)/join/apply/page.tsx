import type { Metadata } from "next";
import Link from "next/link";
import { requireOnboarded } from "@/lib/auth";
import { getDomains, getOpenCycle, getTeams } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { submitApplication } from "@/lib/actions/recruitment";
import { ActionForm, CheckboxGroup, SubmitButton, TextAreaField, TextField } from "@/components/ui/form";
import { ButtonLink } from "@/components/ui/button";
import { Container, EmptyState, Notice, PageHeader, StatusBadge } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Apply" };

export default async function ApplyPage() {
  const viewer = await requireOnboarded();
  const [cycle, domains, teams] = await Promise.all([getOpenCycle(), getDomains(), getTeams()]);
  const p = viewer.profile;

  if (!cycle) {
    return (
      <Container className="max-w-2xl py-16">
        <EmptyState title="Recruitment is closed right now" action={<ButtonLink href="/join" variant="secondary">Back to Join SIC</ButtonLink>} />
      </Container>
    );
  }
  if (viewer.isMember) {
    return (
      <Container className="max-w-2xl py-16">
        <EmptyState title="You're already a member" action={<ButtonLink href="/portal">Go to your portal</ButtonLink>} />
      </Container>
    );
  }
  if (!["pending", "verified"].includes(p.student_status)) {
    return (
      <Container className="flex max-w-2xl flex-col gap-4 py-16">
        <Notice tone="warning" title="Recruitment is for students of our college.">
          Your profile is marked as {p.student_status === "rejected" ? "not verified" : "from another college"}. If that&apos;s wrong, update it in{" "}
          <Link href="/onboarding?next=/join/apply" className="text-primary underline">
            your details
          </Link>
          .
        </Notice>
      </Container>
    );
  }

  return (
    <Container className="flex max-w-2xl flex-col gap-8 py-12">
      <PageHeader hud
        eyebrow={cycle.name}
        title="Apply to SIC"
        description={`Applications close on ${formatDate(cycle.closes_at)}. Your name, branch, year and roll number come from your profile.`}
      />
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-line bg-surface px-4 py-3 text-sm">
        <span>{p.full_name}</span>
        <span className="text-muted">{p.branch} · Year {p.academic_year}</span>
        <span className="font-mono text-muted">{p.roll_number}</span>
        <StatusBadge status={p.student_status} />
      </div>
      <ActionForm action={submitApplication}>
        <input type="hidden" name="cycle_id" value={cycle.id} />
        <CheckboxGroup
          name="domains"
          label="Domains you want to work in"
          hint="Pick up to five."
          options={domains.map((d) => ({ value: d.id, label: d.name }))}
        />
        <CheckboxGroup
          name="teams"
          label="Teams you'd like to join"
          required={false}
          options={teams.map((t) => ({ value: t.id, label: t.name }))}
        />
        <TextAreaField
          name="motivation"
          label="Why do you want to join?"
          rows={6}
          hint="What would you like to build or learn? A few honest sentences are better than a long essay."
        />
        <TextAreaField
          name="experience"
          label="Anything you've built or worked on"
          required={false}
          rows={4}
          hint="Projects, competitions, courses, internships. Beginners are welcome."
        />
        <TextField name="portfolio_url" label="Link to your work" type="url" required={false} placeholder="https://github.com/…" />
        <SubmitButton size="lg" pendingLabel="Submitting…">
          Submit application
        </SubmitButton>
      </ActionForm>
    </Container>
  );
}
