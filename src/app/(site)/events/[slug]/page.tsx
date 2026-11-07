import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getEventBySlug, getSeatsTaken } from "@/lib/data";
import { getViewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EVENT_TYPE_LABEL, formatDateTime, storageUrl } from "@/lib/format";
import { SITE_URL, absoluteUrl, pageMetadata, snippet } from "@/lib/site";
import { JsonLd, breadcrumbLd } from "@/components/json-ld";
import { ButtonLink } from "@/components/ui/button";
import { Badge, Card, Container, Eyebrow, Meta, Notice, StatusBadge } from "@/components/ui/primitives";
import { DateTile } from "@/components/cards";
import { Markdown, outline } from "@/components/markdown";
import { Expandable } from "@/components/rule-book";
import type { SicEvent } from "@/lib/types";

export async function generateMetadata({ params }: PageProps<"/events/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event || !["published", "completed", "cancelled"].includes(event.status)) return { title: "Event", robots: { index: false } };
  return pageMetadata({
    title: event.title,
    description: snippet(event.summary ?? event.description) || `${event.title}: an event by the Science & Innovation Club, GEC Palamu.`,
    path: `/events/${slug}`,
    image: storageUrl(event.cover_path),
  });
}

type RegState = "open" | "not-open" | "closed" | "full" | "registered" | "cancelled" | "past";

function registrationState(event: SicEvent, seatsTaken: number, registered: boolean): RegState {
  const now = Date.now();
  if (event.status === "cancelled") return "cancelled";
  if (event.status !== "published") return "past";
  if (registered) return "registered";
  const closes = event.reg_closes_at ?? event.starts_at;
  if (closes && now >= new Date(closes).getTime()) return "closed";
  if (event.reg_opens_at && now < new Date(event.reg_opens_at).getTime()) return "not-open";
  if (event.capacity && seatsTaken >= event.capacity) return "full";
  return "open";
}

export default async function EventPage({ params }: PageProps<"/events/[slug]">) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event || !["published", "completed", "cancelled"].includes(event.status)) notFound();

  const [seatsTaken, viewer] = await Promise.all([getSeatsTaken(event.id), getViewer()]);
  let registered = false;
  if (viewer) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("event_registrations")
      .select("id")
      .eq("event_id", event.id)
      .eq("user_id", viewer.id)
      .neq("status", "cancelled")
      .maybeSingle();
    registered = Boolean(data);
  }
  const state = registrationState(event, seatsTaken, registered);
  const cover = storageUrl(event.cover_path);
  const toc = event.description ? outline(event.description) : [];
  const seatsLeft = event.capacity ? Math.max(event.capacity - seatsTaken, 0) : null;

  const eventLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: snippet(event.summary ?? event.description, 300) || undefined,
    url: absoluteUrl(`/events/${slug}`),
    image: cover ?? undefined,
    startDate: event.starts_at ?? undefined,
    endDate: event.ends_at ?? undefined,
    eventStatus: event.status === "cancelled" ? "https://schema.org/EventCancelled" : "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: event.venue ?? "Government Engineering College, Palamu",
      address: { "@type": "PostalAddress", addressLocality: "Palamu", addressRegion: "Jharkhand", addressCountry: "IN" },
    },
    organizer: { "@type": "Organization", name: "Science & Innovation Club, GEC Palamu", url: SITE_URL },
    isAccessibleForFree: true,
    offers: {
      "@type": "Offer",
      price: 0,
      priceCurrency: "INR",
      url: absoluteUrl(`/events/${slug}`),
      availability: event.status === "published" ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
    },
  };

  return (
    <Container className="flex flex-col gap-10 py-12">
      <JsonLd data={[eventLd, breadcrumbLd([["Events", "/events"], [event.title, `/events/${slug}`]])]} />
      <Link href="/events" className="text-sm text-muted hover:text-fg">
        ← All events
      </Link>

      <div className="grid gap-10 lg:grid-cols-[1fr_21.25rem]">
        <article className="flex min-w-0 flex-col gap-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="accent">{EVENT_TYPE_LABEL[event.event_type]}</Badge>
            {event.visibility === "members" && <Badge>Members only</Badge>}
            {event.status !== "published" && <StatusBadge status={event.status} />}
          </div>
          <h1 className="text-[clamp(2rem,4.5vw,3rem)] font-semibold">{event.title}</h1>
          {event.summary && <p className="text-lg text-muted">{event.summary}</p>}
          {cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="" className="aspect-[16/9] w-full rounded-xl border border-line object-cover" />
          )}
          {event.description && (
            <section id="rule-book" className="flex scroll-mt-24 flex-col gap-4">
              <Eyebrow>About &amp; rule book</Eyebrow>
              {toc.length >= 2 && (
                <nav aria-label="Rule book contents" className="flex flex-col gap-1.5 rounded-xl border border-line bg-surface/60 p-4">
                  <p className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-subtle">Contents</p>
                  {toc.map((h) => (
                    <a key={h.id} href={`#${h.id}`} className={`text-sm text-muted hover:text-primary ${h.depth === 3 ? "pl-4" : ""}`}>
                      {h.text}
                    </a>
                  ))}
                </nav>
              )}
              <Expandable long={event.description.length > 1800}>
                <Markdown source={event.description} />
              </Expandable>
            </section>
          )}
        </article>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
          <Card className="flex flex-col gap-5 p-5">
            <div className="flex items-center gap-4">
              <DateTile value={event.starts_at} />
              <div className="flex flex-col">
                <span className="font-medium">{formatDateTime(event.starts_at)}</span>
                {event.ends_at && <span className="text-[0.8125rem] text-subtle">Ends {formatDateTime(event.ends_at)}</span>}
              </div>
            </div>
            <Meta
              items={[
                { label: "Venue", value: event.venue ?? "To be announced" },
                {
                  label: "Format",
                  value: event.participation === "team" ? `Teams of ${event.team_min}–${event.team_max}` : "Individual",
                },
                { label: "Registration closes", value: formatDateTime(event.reg_closes_at ?? event.starts_at) },
                ...(seatsLeft !== null ? [{ label: "Seats left", value: <span className="tabular">{seatsLeft} of {event.capacity}</span> }] : []),
              ]}
            />
            <RegisterAction state={state} slug={slug} isTeam={event.participation === "team"} signedIn={Boolean(viewer)} />
          </Card>
          {state === "cancelled" && <Notice tone="danger" title="This event was cancelled." />}
        </aside>
      </div>
    </Container>
  );
}

function RegisterAction({ state, slug, isTeam, signedIn }: { state: RegState; slug: string; isTeam: boolean; signedIn: boolean }) {
  switch (state) {
    case "open":
      return (
        <div className="flex flex-col gap-2">
          <ButtonLink href={`/events/${slug}/register`} size="lg">
            {isTeam ? "Register a team" : "Register"}
          </ButtonLink>
          {!signedIn && <p className="text-center text-[0.8125rem] text-subtle">You&apos;ll sign in first. It takes a minute.</p>}
          {isTeam && <p className="text-center text-[0.8125rem] text-subtle">Got an invite? Open the link in your email instead.</p>}
        </div>
      );
    case "registered":
      return (
        <div className="flex flex-col gap-2">
          <p className="rounded-lg border border-success/40 bg-success/10 px-3 py-2 text-center text-sm text-success">You&apos;re registered</p>
          <ButtonLink href="/portal/registrations" variant="secondary">
            Manage registration
          </ButtonLink>
        </div>
      );
    case "full":
      return <p className="rounded-lg border border-line px-3 py-2 text-center text-sm text-muted">This event is full</p>;
    case "not-open":
      return <p className="rounded-lg border border-line px-3 py-2 text-center text-sm text-muted">Registration opens soon</p>;
    case "closed":
      return <p className="rounded-lg border border-line px-3 py-2 text-center text-sm text-muted">Registration has closed</p>;
    default:
      return null;
  }
}
