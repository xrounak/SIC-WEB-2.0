import type { Metadata } from "next";
import { Container, PageHeader } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Terms" };

const SECTIONS = [
  {
    title: "Accounts",
    body: "Use your real name and an email you can access. One account per person. You're responsible for activity on your account.",
  },
  {
    title: "Event registration",
    body: "Register only if you intend to attend. Team leaders must invite real teammates who agree to take part. The club may cancel or change events and will notify registrants.",
  },
  {
    title: "Projects and media",
    body: "Only submit work you or your team made. By submitting a project you allow the club to show it on this site. Contributors decide whether their name appears.",
  },
  {
    title: "Conduct",
    body: "Don't misuse the site, impersonate others or try to access data that isn't yours. The club may suspend accounts that break these rules or the college's code of conduct.",
  },
];

export default function TermsPage() {
  return (
    <Container className="flex max-w-3xl flex-col gap-10 py-12">
      <PageHeader hud eyebrow="Terms" title="Using this site" description="Last updated 28 October 2026." />
      {SECTIONS.map((s) => (
        <section key={s.title} className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">{s.title}</h2>
          <p className="text-muted">{s.body}</p>
        </section>
      ))}
    </Container>
  );
}
