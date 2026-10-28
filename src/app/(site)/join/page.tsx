import type { Metadata } from "next";
import { getNextCycle, getOpenCycle } from "@/lib/data";
import { getViewer } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { ButtonLink } from "@/components/ui/button";
import { Card, Container, Notice, PageHeader, SectionTitle } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Join SIC" };

const STEPS = [
  ["Apply", "Tell us which domains and teams interest you and what you'd like to build."],
  ["Screening", "Reviewers read every application and confirm you're a student of the college."],
  ["Interview", "A short conversation with the team you're interested in."],
  ["Welcome", "Selected members get access to the member portal, teams and projects."],
];

export default async function JoinPage() {
  const [cycle, nextCycle, viewer] = await Promise.all([getOpenCycle(), getNextCycle(), getViewer()]);
  const external = viewer?.profile.student_status === "external";

  return (
    <Container className="flex flex-col gap-14 py-12">
      <PageHeader hud
        eyebrow="Join SIC"
        title="Become a member"
        description="Recruitment runs in cycles. Anyone can register for public events at any time; membership is for students of the college."
      />

      <Card className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        {cycle ? (
          <>
            <div className="flex flex-col gap-1">
              <p className="text-lg font-semibold">{cycle.name} is open</p>
              <p className="text-sm text-muted">Applications close on {formatDate(cycle.closes_at)}.</p>
            </div>
            {viewer?.isMember ? (
              <p className="text-sm text-success">You&apos;re already a member.</p>
            ) : (
              <ButtonLink href="/join/apply" size="lg">
                Start application
              </ButtonLink>
            )}
          </>
        ) : (
          <div className="flex flex-col gap-1">
            <p className="text-lg font-semibold">Recruitment is closed right now</p>
            <p className="text-sm text-muted">
              {nextCycle ? `The next cycle opens on ${formatDate(nextCycle.opens_at)}.` : "The next cycle will be announced here and on the club's socials."}
            </p>
          </div>
        )}
      </Card>

      {external && (
        <Notice tone="warning" title="Your profile says you're from another college.">
          Membership is open to students of our college only, but you can still register for public events.
        </Notice>
      )}

      <section className="flex flex-col gap-6">
        <SectionTitle title="How recruitment works" />
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(([title, body], i) => (
            <li key={title} className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-5">
              <span className="font-mono text-[0.6875rem] text-primary">STEP {i + 1}</span>
              <span className="font-medium">{title}</span>
              <span className="text-sm text-muted">{body}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="flex flex-col gap-3">
        <SectionTitle title="Before you apply" />
        <ul className="flex max-w-2xl list-disc flex-col gap-2 pl-5 text-sm text-muted">
          <li>Sign in with any email. We don&apos;t need a college email address.</li>
          <li>Add your roll number in your profile. It&apos;s only visible to the people verifying it.</li>
          <li>You can apply once per cycle and withdraw any time before a decision.</li>
        </ul>
      </section>
    </Container>
  );
}
