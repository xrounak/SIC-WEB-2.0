import type { Metadata } from "next";
import { getPastEvents, getUpcomingEvents } from "@/lib/data";
import { Container, EmptyState, PageHeader, SectionTitle } from "@/components/ui/primitives";
import { EventCard } from "@/components/cards";
import { EVENT_TYPE_LABEL } from "@/lib/format";
import Link from "next/link";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Events" };

export default async function EventsPage({ searchParams }: PageProps<"/events">) {
  const { type } = await searchParams;
  const activeType = typeof type === "string" && type in EVENT_TYPE_LABEL ? type : undefined;
  const [upcoming, past] = await Promise.all([getUpcomingEvents(30), getPastEvents(9)]);
  const filtered = activeType ? upcoming.filter((e) => e.event_type === activeType) : upcoming;

  return (
    <Container className="flex flex-col gap-10 py-12">
      <PageHeader hud
        eyebrow="Events"
        title="Workshops, hackathons and talks"
        description="Register with your account. Team events let the leader invite teammates by email."
      />

      <nav aria-label="Filter by type" className="-mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {[{ value: undefined, label: "All" }, ...Object.entries(EVENT_TYPE_LABEL).map(([value, label]) => ({ value, label }))].map(
          (f) => (
            <Link
              key={f.label}
              href={f.value ? `/events?type=${f.value}` : "/events"}
              aria-current={activeType === f.value ? "page" : undefined}
              className={cn(
                "hud-label whitespace-nowrap border px-3 py-2 text-[0.6875rem] transition-colors",
                activeType === f.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-line-strong text-muted hover:text-fg",
              )}
            >
              {f.label}
            </Link>
          ),
        )}
      </nav>

      <section className="flex flex-col gap-4">
        <SectionTitle title="Upcoming" />
        {filtered.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {filtered.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        ) : (
          <EmptyState
            title={activeType ? `No upcoming ${EVENT_TYPE_LABEL[activeType].toLowerCase()} events` : "No upcoming events"}
            description="New events appear here as soon as they're approved and published."
          />
        )}
      </section>

      {past.length > 0 && (
        <section className="flex flex-col gap-4">
          <SectionTitle title="Past events" />
          <div className="grid gap-3 opacity-90 md:grid-cols-2">
            {past.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        </section>
      )}
    </Container>
  );
}
