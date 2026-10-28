import { formatDateTime } from "@/lib/format";
import { StatusBadge } from "@/components/ui/primitives";

export type TimelineEntry = {
  id: string;
  label: string;
  decision: string;
  notes: string | null;
  created_at: string;
  reviewer?: string | null;
};

/** Decision history for a proposal or project, oldest first. */
export function ReviewTimeline({ entries, emptyText }: { entries: TimelineEntry[]; emptyText: string }) {
  if (entries.length === 0) return <p className="text-sm text-muted">{emptyText}</p>;
  return (
    <ol className="flex flex-col">
      {entries.map((e, i) => (
        <li key={e.id} className="relative flex gap-4 pb-6 last:pb-0">
          {i < entries.length - 1 && <span className="absolute left-[0.3125rem] top-4 h-full w-px bg-line" aria-hidden="true" />}
          <span className="mt-1.5 size-[0.6875rem] shrink-0 rounded-full border-2 border-primary bg-bg" aria-hidden="true" />
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">{e.label}</span>
              <StatusBadge status={e.decision === "approved" ? "accepted" : e.decision} />
            </div>
            <span className="text-[0.75rem] text-subtle">
              {formatDateTime(e.created_at)}
              {e.reviewer ? ` · ${e.reviewer}` : ""}
            </span>
            {e.notes && <p className="prose-sic mt-1 rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm">{e.notes}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
