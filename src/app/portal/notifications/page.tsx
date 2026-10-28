import type { Metadata } from "next";
import Link from "next/link";
import { requireViewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { relativeTime } from "@/lib/format";
import { markAllNotificationsRead } from "@/lib/actions/portal";
import { ActionForm, SubmitButton } from "@/components/ui/form";
import { EmptyState, PageHeader } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import type { Notification } from "@/lib/types";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const viewer = await requireViewer();
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", viewer.id)
    .order("created_at", { ascending: false })
    .limit(100);
  const items = (data ?? []) as Notification[];
  const unread = items.filter((n) => !n.read_at).length;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Notifications"
        description={unread ? `${unread} unread` : "You're all caught up."}
        actions={
          unread > 0 && (
            <ActionForm action={markAllNotificationsRead} hideMessages>
              <SubmitButton variant="secondary" size="sm" pendingLabel="…">
                Mark all read
              </SubmitButton>
            </ActionForm>
          )
        }
      />
      {items.length === 0 ? (
        <EmptyState title="No notifications yet" description="Decisions, invites and team updates show up here." />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
          {items.map((n) => (
            <li key={n.id}>
              <Link
                href={n.target_url ?? "/portal"}
                className={cn("flex gap-3 p-4 transition-colors hover:bg-surface-2", !n.read_at && "bg-primary/5")}
              >
                <span className={cn("mt-2 size-2 shrink-0 rounded-full", n.read_at ? "bg-transparent" : "bg-primary")} aria-hidden="true" />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className={cn("text-sm", !n.read_at && "font-medium")}>{n.title}</span>
                  {n.body && <span className="line-clamp-2 text-[0.8125rem] text-muted">{n.body}</span>}
                </span>
                <span className="shrink-0 text-[0.75rem] text-subtle">{relativeTime(n.created_at)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
