import type { Metadata } from "next";
import Link from "next/link";
import { getDomains, getTeams } from "@/lib/data";
import { Container, EmptyState, PageHeader } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Domains" };

export default async function DomainsPage() {
  const [domains, teams] = await Promise.all([getDomains(), getTeams()]);
  const opsTeams = teams.filter((t) => !t.domain_id);

  return (
    <Container className="flex flex-col gap-12 py-12">
      <PageHeader hud
        eyebrow="Domains"
        title="Every discipline, one club"
        description="Members join one or more domains and work in teams. Pick a domain to see its teams, projects and events."
      />
      {domains.length > 0 ? (
        <div className="grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {domains.map((d) => {
            const domainTeams = teams.filter((t) => t.domain_id === d.id);
            return (
              <Link key={d.id} href={`/domains/${d.slug}`} className="group flex flex-col gap-3 bg-surface p-6 transition-colors hover:bg-surface-2">
                <span className="font-mono text-[0.6875rem] text-subtle">{d.slug.slice(0, 3).toUpperCase()}</span>
                <span className="text-xl font-semibold group-hover:text-primary">{d.name}</span>
                {d.description && <p className="line-clamp-3 text-sm text-muted">{d.description}</p>}
                {domainTeams.length > 0 && (
                  <p className="mt-auto text-[0.8125rem] text-subtle">Teams: {domainTeams.map((t) => t.name).join(", ")}</p>
                )}
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState title="Domains will appear here" description="Load the seed data to see the club's disciplines." />
      )}

      {opsTeams.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Operations teams</h2>
          <p className="max-w-2xl text-muted">The people who run events, tell the club&apos;s story and keep things organised.</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {opsTeams.map((t) => (
              <div key={t.id} className="rounded-xl border border-line bg-surface p-5">
                <p className="font-medium">{t.name}</p>
                {t.description && <p className="mt-1 text-sm text-muted">{t.description}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </Container>
  );
}
