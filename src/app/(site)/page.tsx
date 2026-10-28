import { getDomains, getOpenCycle, getPublicAnnouncements, getPublishedProjects, getTeams, getUpcomingEvents } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { Container, EmptyState } from "@/components/ui/primitives";
import { EventCard, ProjectCard } from "@/components/cards";
import { BracketLink, ChamferButton, ChamferPanel, SectionHead } from "@/components/hud";
import { DomainGlyph } from "@/components/domain-glyph";
import { HorizontalScroller } from "@/components/horizontal-scroller";
import { ThemedHeroTitle } from "@/seasonal/HeroArt";

export default async function HomePage() {
  const [events, projects, domains, teams, cycle, announcements] = await Promise.all([
    getUpcomingEvents(4),
    getPublishedProjects(3),
    getDomains(),
    getTeams(),
    getOpenCycle(),
    getPublicAnnouncements(3),
  ]);

  return (
    <>
      {/* ------------------------------------------------------------- Hero */}
      <section className="relative flex min-h-[calc(100svh-4rem)] flex-col items-center justify-center overflow-hidden px-4 text-center">
        <div className="hero-zoom flex flex-col items-center">
          <h1 className="sr-only">SIC — Science &amp; Innovation Club, GEC Palamu</h1>
          <ThemedHeroTitle
            fallback={
              <div aria-hidden="true" className="flex flex-col items-center">
                <p className="hud-label text-[0.75rem] text-muted">Science &amp; Innovation Club</p>
                <p className="font-brand text-[clamp(6rem,26vw,18rem)] font-black leading-[0.9] tracking-[0.02em]">
                  SIC<span className="text-primary">.</span>
                </p>
              </div>
            }
          />
          <p className="hero-subtitle mt-2 font-display text-[clamp(1.25rem,3vw,2rem)] font-semibold text-muted" aria-hidden="true">
            <span className="hero-default-inline">by </span>
            <span className="text-fg">GEC Palamu</span>
          </p>
          <p className="hud-label mt-4 text-[0.6875rem] text-subtle">Engineering · Science · Making</p>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
          <ChamferButton href="/events">Explore events</ChamferButton>
          <BracketLink href="/join">{cycle ? "Recruitment open" : "Join SIC"}</BracketLink>
        </div>

        <div className="absolute inset-x-0 bottom-6 flex flex-col items-center gap-2" aria-hidden="true">
          <span className="hud-label text-[0.625rem] text-subtle">Scroll</span>
          <span className="scroll-cue" />
        </div>
      </section>

      {/* ----------------------------------------- Domains: horizontal journey */}
      {domains.length > 0 && (
        <HorizontalScroller label="Domains">
          <div className="flex w-[min(80vw,23.75rem)] shrink-0 flex-col justify-center gap-5 pr-6">
            <span className="hud-label text-primary">01 · Domains</span>
            <h2 className="font-brand text-[clamp(2.2rem,4.6vw,3.6rem)] font-black uppercase leading-[1]">
              {domains.length} disciplines.
              <br />
              One lab.
            </h2>
            <p className="text-muted">{teams.length} teams across every branch. Keep scrolling to move through them.</p>
          </div>

          {domains.map((d, i) => {
            const teamCount = teams.filter((t) => t.domain_id === d.id).length;
            return (
              <ChamferPanel
                key={d.id}
                href={`/domains/${d.slug}`}
                className="h-[min(58svh,27.5rem)] w-[min(78vw,21.25rem)] shrink-0"
                innerClassName="relative flex h-full flex-col justify-between overflow-hidden p-6"
              >
                <span
                  aria-hidden="true"
                  className="outline-text pointer-events-none absolute -right-4 -top-6 font-hud text-[9rem] font-bold leading-none"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <DomainGlyph slug={d.slug} size={56} className="relative text-primary" />
                <div className="relative flex flex-col gap-2">
                  <span className="font-brand text-2xl font-black uppercase leading-tight tracking-[0.04em]">{d.name}</span>
                  <span className="hud-label text-[0.625rem] text-subtle">
                    {teamCount} team{teamCount === 1 ? "" : "s"}
                  </span>
                  <span className="hud-label mt-3 text-[0.6875rem] text-muted transition-colors group-hover:text-primary">Explore →</span>
                </div>
              </ChamferPanel>
            );
          })}

          <div className="flex w-[min(80vw,22.5rem)] shrink-0 flex-col justify-center gap-5 pl-6">
            <span className="hud-label text-primary">Got an idea?</span>
            <p className="font-brand text-2xl font-black uppercase leading-tight">Build it with people from every branch.</p>
            <div>
              <ChamferButton href="/join">Join SIC</ChamferButton>
            </div>
          </div>
        </HorizontalScroller>
      )}

      <Container className="flex flex-col gap-28 py-24">
        {/* --------------------------------------------------------- Events */}
        <section className="reveal flex flex-col gap-8">
          <SectionHead index="02" title="Upcoming events" kicker="Register with your account" action={<BracketLink href="/events">All events</BracketLink>} />
          {events.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {events.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          ) : (
            <EmptyState title="Nothing scheduled right now" description="New workshops and competitions show up here as soon as they're published." />
          )}
        </section>

        {/* ------------------------------------------------------- Projects */}
        <section className="reveal flex flex-col gap-8">
          <SectionHead index="03" title="From the lab" kicker="Reviewed member projects" action={<BracketLink href="/projects">All projects</BracketLink>} />
          {projects.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((p, i) => (
                <ProjectCard key={p.id} project={p} index={i} />
              ))}
            </div>
          ) : (
            <EmptyState title="No projects published yet" description="Member projects show up here once they're reviewed." />
          )}
        </section>

        {/* ---------------------------------------------- Join + notices */}
        <section className="reveal grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="hud-corners relative overflow-hidden border border-line bg-surface p-8 sm:p-10">
            <div className="hud-grid-flat pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
            <div className="relative flex flex-col gap-5">
              <span className="hud-label text-primary">04 · Join SIC</span>
              <h2 className="max-w-md text-3xl font-bold leading-tight sm:text-4xl">
                {cycle ? `${cycle.name} recruitment is open.` : "Want to build with us?"}
              </h2>
              <p className="max-w-md text-muted">
                {cycle
                  ? `Pick your domains and teams and tell us what you want to build. Applications close ${formatDate(cycle.closes_at)}.`
                  : "Recruitment runs in cycles. Register for public events any time, and apply when the next cycle opens."}
              </p>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                <ChamferButton href={cycle ? "/join/apply" : "/join"}>{cycle ? "Apply now" : "How joining works"}</ChamferButton>
                <BracketLink href="/about">About the club</BracketLink>
              </div>
            </div>
          </div>

          <div className="flex flex-col border border-line bg-surface">
            <p className="hud-label border-b border-line px-5 py-3 text-subtle">Notice board</p>
            {announcements.length > 0 ? (
              <ul className="flex flex-1 flex-col divide-y divide-line">
                {announcements.map((a) => (
                  <li key={a.id} className="flex flex-col gap-1 px-5 py-4">
                    <span className="hud-label text-[0.625rem] text-primary">{formatDate(a.published_at)}</span>
                    <span className="font-medium">{a.title}</span>
                    <span className="line-clamp-2 text-sm text-muted">{a.body}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-6 text-sm text-muted">No notices right now.</p>
            )}
          </div>
        </section>
      </Container>
    </>
  );
}
