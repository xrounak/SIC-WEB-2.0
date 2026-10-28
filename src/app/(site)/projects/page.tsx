import type { Metadata } from "next";
import Link from "next/link";
import { getDomains, getPublishedProjects } from "@/lib/data";
import { cn } from "@/lib/cn";
import { Container, EmptyState, PageHeader } from "@/components/ui/primitives";
import { ProjectCard } from "@/components/cards";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage({ searchParams }: PageProps<"/projects">) {
  const { domain } = await searchParams;
  const domains = await getDomains();
  const active = domains.find((d) => d.slug === domain);
  const projects = await getPublishedProjects(48, active?.id);

  return (
    <Container className="flex flex-col gap-10 py-12">
      <PageHeader hud
        eyebrow="Projects"
        title="What members have built"
        description="Every project here was submitted by a member and reviewed by the club. Contributors are credited only with their consent."
      />
      {domains.length > 0 && (
        <nav aria-label="Filter by domain" className="-mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
          {[{ slug: undefined, name: "All" }, ...domains].map((d) => (
            <Link
              key={d.name}
              href={d.slug ? `/projects?domain=${d.slug}` : "/projects"}
              aria-current={active?.slug === d.slug ? "page" : undefined}
              className={cn(
                "hud-label whitespace-nowrap border px-3 py-2 text-[0.6875rem] transition-colors",
                active?.slug === d.slug ? "border-primary bg-primary/10 text-primary" : "border-line-strong text-muted hover:text-fg",
              )}
            >
              {d.name}
            </Link>
          ))}
        </nav>
      )}
      {projects.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      ) : (
        <EmptyState
          title={active ? `No ${active.name} projects yet` : "No projects published yet"}
          description="Members can submit projects from their portal."
        />
      )}
    </Container>
  );
}
