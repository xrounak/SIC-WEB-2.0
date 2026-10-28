import type { Metadata } from "next";
import { Container, PageHeader } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Privacy" };

const SECTIONS = [
  {
    title: "What we collect",
    body: "Your name, email, phone number, college, branch and year. Students of our college also give a roll number so we can confirm eligibility for membership. If you sign in with Google, we receive your name, email and profile photo.",
  },
  {
    title: "Why we collect it",
    body: "To run event registrations, send confirmations and updates, form teams, review recruitment applications and keep a record of club decisions.",
  },
  {
    title: "Who can see it",
    body: "Your phone number, email and roll number are never public. Organisers see the details of people registered for events their team runs. Recruitment reviewers see applications in cycles they are assigned to. Your name and photo appear publicly only if you turn on a public profile or agree to be credited on a project.",
  },
  {
    title: "How long we keep it",
    body: "Event registrations and recruitment applications are kept for two academic years, then deleted or anonymised. Your account stays until you ask us to delete it.",
  },
  {
    title: "Your choices",
    body: "You can edit your profile, hide your public profile, decline project credit and withdraw registrations or applications at any time. To correct or delete your data, contact the club.",
  },
];

export default function PrivacyPage() {
  return (
    <Container className="flex max-w-3xl flex-col gap-10 py-12">
      <PageHeader hud eyebrow="Privacy" title="How we handle your data" description="Last updated 28 October 2026." />
      {SECTIONS.map((s) => (
        <section key={s.title} className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">{s.title}</h2>
          <p className="text-muted">{s.body}</p>
        </section>
      ))}
    </Container>
  );
}
