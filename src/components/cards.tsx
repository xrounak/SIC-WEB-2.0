import type { Project, SicEvent } from "@/lib/types";
import { EVENT_TYPE_LABEL, dateTile, formatDateTime, storageUrl } from "@/lib/format";
import { StatusBadge } from "@/components/ui/primitives";
import { ChamferPanel } from "@/components/hud";

const TIME = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

export function DateTile({ value }: { value: string | null }) {
  const { day, month } = dateTile(value);
  return (
    <div className="flex size-14 shrink-0 flex-col items-center justify-center border border-line-strong bg-bg chamfer" style={{ ["--cut" as string]: "8px" }}>
      <span className="hud-label text-[0.625rem] text-primary">{month}</span>
      <span className="font-hud text-xl font-bold leading-none tabular">{day}</span>
    </div>
  );
}

/** Event "ticket": date stub, perforation, details. */
export function EventCard({ event, showStatus = false }: { event: SicEvent; showStatus?: boolean }) {
  const { day, month } = dateTile(event.starts_at);
  const tags = [
    EVENT_TYPE_LABEL[event.event_type] ?? event.event_type,
    event.participation === "team" ? `Teams ${event.team_min}–${event.team_max}` : "Solo",
    event.visibility === "members" ? "Members" : null,
  ].filter(Boolean);

  return (
    <ChamferPanel href={event.slug ? `/events/${event.slug}` : "#"} innerClassName="flex">
      <div className="flex w-20 shrink-0 flex-col items-center justify-center gap-1 bg-surface-2 py-5">
        <span className="hud-label text-[0.625rem] text-primary">{month}</span>
        <span className="font-hud text-4xl font-bold leading-none tabular">{day}</span>
        {event.starts_at && <span className="hud-label text-[0.625rem] text-subtle">{TIME.format(new Date(event.starts_at))}</span>}
      </div>
      <div className="w-0 border-l border-dashed border-line-strong" aria-hidden="true" />
      <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
        <div className="hud-label flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.625rem] text-subtle">
          {tags.map((t, i) => (
            <span key={t} className={i === 0 ? "text-primary" : undefined}>
              {i > 0 && <span className="mr-2 text-line-strong">/</span>}
              {t}
            </span>
          ))}
          {(showStatus || event.status === "cancelled") && <StatusBadge status={event.status} className="ml-1" />}
        </div>
        <h3 className="text-[1.0625rem] font-semibold leading-snug transition-colors group-hover:text-primary">{event.title}</h3>
        {event.summary && <p className="line-clamp-2 text-sm text-muted">{event.summary}</p>}
        <p className="mt-auto truncate text-[0.8125rem] text-subtle">
          {event.venue ?? formatDateTime(event.starts_at)}
        </p>
      </div>
    </ChamferPanel>
  );
}

export function ProjectCard({ project, index }: { project: Project; index?: number }) {
  const cover = storageUrl(project.cover_path);
  return (
    <ChamferPanel href={project.slug ? `/projects/${project.slug}` : "#"} innerClassName="flex flex-col">
      <div className="relative aspect-[16/10] w-full overflow-hidden border-b border-line bg-surface-2">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        ) : (
          <ProjectPlaceholder title={project.title} />
        )}
        {index !== undefined && (
          <span className="hud-label absolute left-3 top-3 bg-bg/80 px-1.5 py-0.5 text-[0.625rem] text-primary">
            P-{String(index + 1).padStart(2, "0")}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="text-[1.0625rem] font-semibold transition-colors group-hover:text-primary">{project.title}</h3>
        {project.summary && <p className="line-clamp-2 text-sm text-muted">{project.summary}</p>}
      </div>
    </ChamferPanel>
  );
}

/** Blueprint sheet when a project has no cover image. */
function ProjectPlaceholder({ title }: { title: string }) {
  return (
    <div className="hud-grid-flat relative flex h-full w-full items-end p-4">
      <svg viewBox="0 0 200 120" className="absolute inset-0 m-auto h-3/4 w-3/4 text-line-strong" aria-hidden="true">
        <g fill="none" stroke="currentColor" strokeWidth="0.8">
          <circle cx="100" cy="60" r="34" strokeDasharray="3 3" />
          <path d="M40 60h120M100 14v92" strokeDasharray="1 4" />
          <rect x="74" y="34" width="52" height="52" />
        </g>
      </svg>
      <span className="hud-label relative text-[0.625rem] text-subtle">{title.slice(0, 36)}</span>
    </div>
  );
}
