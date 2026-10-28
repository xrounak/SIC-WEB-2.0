import { requireOnboarded } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/layout/site-header";
import { SideNav } from "@/components/layout/nav";
import { StatusBadge } from "@/components/ui/primitives";

export default async function PortalLayout({ children }: LayoutProps<"/portal">) {
  const viewer = await requireOnboarded();
  const supabase = await createClient();
  const { count: unread } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", viewer.id)
    .is("read_at", null);

  const items = [
    { href: "/portal", label: "Overview", exact: true },
    { href: "/portal/registrations", label: "Registrations" },
    { href: "/portal/applications", label: "Applications" },
    { href: "/portal/notifications", label: "Notifications", badge: unread ?? 0 },
    ...(viewer.isMember
      ? [
          { href: "/portal/proposals", label: "Event proposals" },
          { href: "/portal/projects", label: "Projects" },
          { href: "/portal/teams", label: "My teams" },
          { href: "/portal/notices", label: "Notices" },
        ]
      : []),
    { href: "/portal/profile", label: "Profile" },
  ];

  return (
    <>
      <SiteHeader />
      <div className="relative z-10 mx-auto grid w-full max-w-content gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[12.5rem_1fr] lg:py-12">
        <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
          <div className="hidden flex-col gap-1 px-3 lg:flex">
            <p className="truncate text-sm font-medium">{viewer.profile.full_name}</p>
            <StatusBadge status={viewer.profile.member_status} className="self-start" />
          </div>
          <SideNav items={items} label="Portal" />
        </aside>
        <main id="main" className="min-w-0">
          {children}
        </main>
      </div>
    </>
  );
}
