import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Container({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-content px-4 sm:px-6", className)} {...props} />;
}

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-xl border border-line bg-surface shadow-card", className)}
      {...props}
    />
  );
}

export function Eyebrow({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      className={cn("font-mono text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-primary", className)}
      {...props}
    />
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
  hud = false,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
  /** Public-site style: instrument rule above, large uppercase HUD title. */
  hud?: boolean;
}) {
  return (
    <header className={cn("flex flex-col gap-4", className)}>
      {hud && eyebrow && (
        <div className="flex items-center gap-3">
          <span className="hud-label text-primary">{eyebrow}</span>
          <span className="h-px flex-1 bg-line" aria-hidden="true" />
        </div>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          {!hud && eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
          <h1
            className={
              hud
                ? "font-brand text-[clamp(2rem,5vw,3.4rem)] font-black uppercase leading-[1] tracking-[0.04em]"
                : "text-3xl font-semibold sm:text-4xl"
            }
          >
            {title}
          </h1>
          {description && <p className="max-w-2xl text-muted">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  );
}

export function SectionTitle({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold">{title}</h2>
        {description && <p className="text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-xl border border-dashed border-line-strong px-6 py-12 text-center",
        className,
      )}
    >
      <p className="font-medium">{title}</p>
      {description && <p className="max-w-md text-sm text-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

type Tone = "neutral" | "accent" | "success" | "warning" | "danger";

const tones: Record<Tone, string> = {
  neutral: "border-line-strong text-muted",
  accent: "border-primary/40 bg-primary/10 text-primary",
  success: "border-success/40 bg-success/10 text-success",
  warning: "border-warning/40 bg-warning/10 text-warning",
  danger: "border-danger/40 bg-danger/10 text-danger",
};

export function Badge({ tone = "neutral", className, ...props }: ComponentProps<"span"> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[0.6875rem] font-medium whitespace-nowrap",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

const STATUS: Record<string, { label: string; tone: Tone }> = {
  draft: { label: "Draft", tone: "neutral" },
  pending_review: { label: "In review", tone: "warning" },
  changes_requested: { label: "Changes requested", tone: "warning" },
  lead_approved: { label: "Lead approved", tone: "accent" },
  final_approved: { label: "Approved", tone: "accent" },
  published: { label: "Published", tone: "success" },
  completed: { label: "Completed", tone: "neutral" },
  cancelled: { label: "Cancelled", tone: "danger" },
  rejected: { label: "Rejected", tone: "danger" },
  archived: { label: "Archived", tone: "neutral" },
  submitted: { label: "Submitted", tone: "warning" },
  in_review: { label: "In review", tone: "warning" },
  registered: { label: "Registered", tone: "success" },
  attended: { label: "Attended", tone: "success" },
  no_show: { label: "No-show", tone: "neutral" },
  forming: { label: "Forming", tone: "warning" },
  complete: { label: "Complete", tone: "success" },
  withdrawn: { label: "Withdrawn", tone: "neutral" },
  pending: { label: "Pending", tone: "warning" },
  accepted: { label: "Accepted", tone: "success" },
  declined: { label: "Declined", tone: "neutral" },
  revoked: { label: "Revoked", tone: "neutral" },
  expired: { label: "Expired", tone: "neutral" },
  screening: { label: "Screening", tone: "warning" },
  shortlisted: { label: "Shortlisted", tone: "accent" },
  interview: { label: "Interview", tone: "accent" },
  selected: { label: "Selected", tone: "success" },
  waitlisted: { label: "Waitlisted", tone: "warning" },
  open: { label: "Open", tone: "success" },
  closed: { label: "Closed", tone: "neutral" },
  verified: { label: "Verified", tone: "success" },
  unverified: { label: "Unverified", tone: "neutral" },
  external: { label: "External", tone: "neutral" },
  member: { label: "Member", tone: "success" },
  applicant: { label: "Applicant", tone: "warning" },
  none: { label: "Not a member", tone: "neutral" },
  alumni: { label: "Alumni", tone: "neutral" },
  suspended: { label: "Suspended", tone: "danger" },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const s = STATUS[status] ?? { label: status.replaceAll("_", " "), tone: "neutral" as Tone };
  return (
    <Badge tone={s.tone} className={className}>
      {s.label}
    </Badge>
  );
}

export function Notice({
  tone = "accent",
  title,
  children,
  className,
}: {
  tone?: Tone;
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  const bar: Record<Tone, string> = {
    neutral: "border-l-line-strong",
    accent: "border-l-primary",
    success: "border-l-success",
    warning: "border-l-warning",
    danger: "border-l-danger",
  };
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn("rounded-lg border border-line border-l-[3px] bg-surface px-4 py-3 text-sm", bar[tone], className)}
    >
      {title && <p className="font-medium">{title}</p>}
      {children && <div className={cn("text-muted", title && "mt-0.5")}>{children}</div>}
    </div>
  );
}

export function Avatar({ name, src, size = 36 }: { name: string; src?: string | null; size?: number }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "?";
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-line-strong bg-surface-2 font-mono text-xs text-muted"
      style={{ width: size, height: size }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" width={size} height={size} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        initials
      )}
    </span>
  );
}

/** Label/value pairs for detail pages. */
export function Meta({ items }: { items: Array<{ label: string; value: ReactNode }> }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="flex min-w-0 flex-col gap-0.5">
          <dt className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-subtle">{item.label}</dt>
          <dd className="min-w-0 break-words">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-surface">
      <table className="w-full min-w-[35rem] border-collapse text-sm">
        <thead>
          <tr className="border-b border-line bg-surface-2/60 text-left">
            {head.map((h) => (
              <th key={h} className="px-4 py-2.5 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-subtle">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&>tr:not(:last-child)]:border-b [&>tr]:border-line [&_td]:px-4 [&_td]:py-3 [&_td]:align-top">
          {children}
        </tbody>
      </table>
    </div>
  );
}
