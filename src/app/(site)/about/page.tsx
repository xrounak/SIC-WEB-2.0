import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import { getLeadership, getTeams } from "@/lib/data";
import { Avatar, Container, PageHeader, SectionTitle } from "@/components/ui/primitives";

export const metadata: Metadata = pageMetadata({ title: "About", description: "About the Science & Innovation Club of GEC Palamu: who we are, what we build and how students from every branch work together.", path: "/about" });

const PRINCIPLES = [
  {
    title: "Build, then explain",
    body: "Every domain works toward something that runs: a robot, a circuit, a structure, a model, an app.",
  },
  {
    title: "Across disciplines",
    body: "Mechanical, civil, IoT and robotics, and software students share benches, not just events.",
  },
  {
    title: "Reviewed and credited",
    body: "Events and projects are reviewed before they're published, and contributors are credited with their consent.",
  },
];

export default async function AboutPage() {
  const [{ leads }, teams] = await Promise.all([getLeadership(), getTeams()]);
  const teamName = (id: string) => teams.find((t) => t.id === id)?.name ?? "Team";

  return (
    <Container className="flex flex-col gap-16 py-12">
      <PageHeader hud
        eyebrow="About SIC"
        title="A club for people who make things work"
        description="The Science & Innovation Club is run by students. Members propose events, build projects in teams, and learn from each other across disciplines."
      />

      <section className="grid gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-3">
        {PRINCIPLES.map((p) => (
          <div key={p.title} className="flex flex-col gap-2 bg-surface p-6">
            <h2 className="text-lg font-semibold">{p.title}</h2>
            <p className="text-sm text-muted">{p.body}</p>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-6">
        <SectionTitle title="How decisions are made" />
        <ol className="grid gap-3 md:grid-cols-3">
          {[
            ["Propose", "Any member can propose an event or submit a project from the portal."],
            ["Review", "The lead of the owning team reviews it. Major events also need an admin's final approval."],
            ["Publish", "Approved events open for registration; approved projects appear in the gallery."],
          ].map(([title, body], i) => (
            <li key={title} className="flex gap-4 rounded-xl border border-line bg-surface p-5">
              <span className="font-mono text-sm text-primary">{i + 1}</span>
              <span className="flex flex-col gap-1">
                <span className="font-medium">{title}</span>
                <span className="text-sm text-muted">{body}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="flex flex-col gap-6">
        <SectionTitle title="Leadership" description="Team leads who chose to appear here." />
        {leads.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {leads.map((l) => (
              <div key={`${l.team_id}-${l.member_id}`} className="flex items-center gap-4 rounded-xl border border-line bg-surface p-4">
                <Avatar name={l.full_name} src={l.avatar_url} size={48} />
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-medium">{l.full_name}</span>
                  <span className="text-[0.8125rem] text-muted">Lead, {teamName(l.team_id)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">Team leads appear here once they make their profiles public.</p>
        )}
      </section>
    </Container>
  );
}
