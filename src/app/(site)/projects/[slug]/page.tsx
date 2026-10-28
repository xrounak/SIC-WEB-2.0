import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectBySlug } from "@/lib/data";
import { formatDate, storageUrl } from "@/lib/format";
import { buttonClass } from "@/components/ui/button";
import { Avatar, Badge, Card, Container, Eyebrow } from "@/components/ui/primitives";

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const data = await getProjectBySlug((await params).slug);
  return data ? { title: data.project.title, description: data.project.summary ?? undefined } : { title: "Project" };
}

export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const data = await getProjectBySlug((await params).slug);
  if (!data || data.project.status !== "published") notFound();
  const { project, contributors, domains, media } = data;
  const cover = storageUrl(project.cover_path);

  const sections = [
    { title: "The problem", body: project.problem },
    { title: "What we built", body: project.solution },
    { title: "Hardware", body: project.hardware_details },
    { title: "Software", body: project.software_details },
    { title: "Outcomes", body: project.outcomes },
  ].filter((s) => s.body);

  return (
    <Container className="flex flex-col gap-10 py-12">
      <Link href="/projects" className="text-sm text-muted hover:text-fg">
        ← All projects
      </Link>
      <div className="grid gap-10 lg:grid-cols-[1fr_18.75rem]">
        <article className="flex min-w-0 flex-col gap-8">
          <header className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              {domains.map((d) => (
                <Badge key={d.slug} tone="accent">
                  {d.name}
                </Badge>
              ))}
            </div>
            <h1 className="text-[clamp(2rem,4.5vw,3rem)] font-semibold">{project.title}</h1>
            {project.summary && <p className="text-lg text-muted">{project.summary}</p>}
          </header>
          {cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="" className="aspect-[16/9] w-full rounded-xl border border-line object-cover" />
          )}
          {sections.map((s) => (
            <section key={s.title} className="flex flex-col gap-2">
              <Eyebrow>{s.title}</Eyebrow>
              <div className="prose-sic">{s.body}</div>
            </section>
          ))}
          {media.filter((m) => m.media_type === "image").length > 0 && (
            <section className="flex flex-col gap-3">
              <Eyebrow>Gallery</Eyebrow>
              <div className="grid gap-3 sm:grid-cols-2">
                {media
                  .filter((m) => m.media_type === "image")
                  .map((m) => (
                    <figure key={m.id} className="flex flex-col gap-1.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={storageUrl(m.storage_path) ?? ""} alt={m.caption ?? ""} className="aspect-[4/3] w-full rounded-lg border border-line object-cover" />
                      {m.caption && <figcaption className="text-[0.8125rem] text-subtle">{m.caption}</figcaption>}
                    </figure>
                  ))}
              </div>
            </section>
          )}
        </article>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
          <Card className="flex flex-col gap-4 p-5">
            <p className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-subtle">Built by</p>
            {contributors.length > 0 ? (
              <ul className="flex flex-col gap-3">
                {contributors.map((c) => (
                  <li key={c.member_id} className="flex items-center gap-3">
                    <Avatar name={c.full_name} src={c.avatar_url} size={32} />
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium">{c.full_name}</span>
                      {c.contribution && <span className="truncate text-[0.8125rem] text-subtle">{c.contribution}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">SIC members</p>
            )}
            <p className="text-[0.8125rem] text-subtle">Published {formatDate(project.published_at)}</p>
            <div className="flex flex-col gap-2">
              {project.repo_url && (
                <a href={project.repo_url} target="_blank" rel="noreferrer" className={buttonClass("secondary")}>
                  Source code ↗
                </a>
              )}
              {project.demo_url && (
                <a href={project.demo_url} target="_blank" rel="noreferrer" className={buttonClass("secondary")}>
                  Live demo ↗
                </a>
              )}
            </div>
          </Card>
        </aside>
      </div>
    </Container>
  );
}
