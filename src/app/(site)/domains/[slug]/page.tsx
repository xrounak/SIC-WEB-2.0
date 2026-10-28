import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDomains, getLeadership, getPublishedProjects, getTeams, getUpcomingEvents } from "@/lib/data";
import { Avatar, Container, EmptyState, PageHeader, SectionTitle } from "@/components/ui/primitives";
import { EventCard, ProjectCard } from "@/components/cards";

export async function generateMetadata({ params }: PageProps<"/domains/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const domain = (await getDomains()).find((d) => d.slug === slug);
  return { title: domain?.name ?? "Domain" };
}

export default async function DomainPage({ params }: PageProps<"/domains/[slug]">) {
  const { slug } = await params;
  const domain = (await getDomains()).find((d) => d.slug === slug);
  if (!domain) notFound();

  const [teams, events, projects, leadership] = await Promise.all([
    getTeams(),
    getUpcomingEvents(6, domain.id),
    getPublishedProjects(6, domain.id),
    getLeadership(),
  ]);
  const domainTeams = teams.filter((t) => t.domain_id === domain.id);

  return (
    <Container className="flex flex-col gap-14 py-12">
      <Link href="/domains" className="text-sm text-muted hover:text-fg">
        ← All domains
      </Link>
      <PageHeader hud eyebrow="Domain" title={domain.name} description={domain.description ?? undefined} />

      {domainTeams.length > 0 && (
        <section className="flex flex-col gap-4">
          <SectionTitle title="Teams" />
          <div className="grid gap-3 sm:grid-cols-2">
            {domainTeams.map((t) => {
              const leads = leadership.leads.filter((l) => l.team_id === t.id);
              return (
                <div key={t.id} className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-5">
                  <p className="font-medium">{t.name}</p>
                  {t.description && <p className="text-sm text-muted">{t.description}</p>}
                  {leads.length > 0 && (
                    <div className="flex flex-wrap items-center gap-3">
                      {leads.map((l) => (
                        <span key={l.member_id} className="flex items-center gap-2 text-[0.8125rem] text-muted">
                          <Avatar name={l.full_name} src={l.avatar_url} size={24} /> {l.full_name} · Lead
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-4">
        <SectionTitle title="Upcoming events" />
        {events.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {events.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        ) : (
          <EmptyState title={`No ${domain.name} events scheduled`} />
        )}
      </section>

      <section className="flex flex-col gap-4">
        <SectionTitle title="Projects" />
        {projects.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        ) : (
          <EmptyState title={`No ${domain.name} projects published yet`} />
        )}
      </section>
    </Container>
  );
}
