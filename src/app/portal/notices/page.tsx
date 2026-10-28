import type { Metadata } from "next";
import { requireMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui/primitives";
import type { Announcement } from "@/lib/types";

export const metadata: Metadata = { title: "Notices" };

export default async function NoticesPage() {
  await requireMember();
  const supabase = await createClient();
  const { data } = await supabase
    .from("announcements")
    .select("*, teams(name)")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(50);
  const items = (data ?? []) as Array<Announcement & { teams: { name: string } | null }>;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Notices" description="Announcements for members and your teams." />
      {items.length === 0 ? (
        <EmptyState title="No notices yet" />
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((a) => (
            <li key={a.id}>
              <Card className="flex flex-col gap-2 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={a.audience === "team" ? "accent" : "neutral"}>
                    {a.audience === "team" ? a.teams?.name ?? "Team" : a.audience === "members" ? "All members" : "Public"}
                  </Badge>
                  <span className="text-[0.8125rem] text-subtle">{formatDate(a.published_at)}</span>
                </div>
                <h2 className="text-lg font-semibold">{a.title}</h2>
                <div className="prose-sic text-sm text-muted">{a.body}</div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
