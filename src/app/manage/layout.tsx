import { requireManager } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/format";
import { SiteHeader } from "@/components/layout/site-header";
import { SideNav } from "@/components/layout/nav";

export default async function ManageLayout({ children }: LayoutProps<"/manage">) {
  const viewer = await requireManager();
  const scope = viewer.roles.length
    ? viewer.roles.map((r) => ROLE_LABEL[r]).join(", ")
    : `Lead of ${viewer.leadTeamIds.length} team${viewer.leadTeamIds.length > 1 ? "s" : ""}`;

  const items = [
    { href: "/manage", label: "Inbox", exact: true },
    { href: "/manage/events", label: "Events" },
    { href: "/manage/projects", label: "Projects" },
    { href: "/manage/recruitment", label: "Recruitment" },
    { href: "/manage/members", label: "Members" },
    { href: "/manage/announcements", label: "Announcements" },
    ...(viewer.isExec || viewer.isAdmin ? [{ href: "/manage/teams", label: "Teams & domains" }] : []),
    ...(viewer.isAdmin ? [{ href: "/manage/roles", label: "Roles" }] : []),
    ...(viewer.isAdmin || viewer.roles.includes("president") ? [{ href: "/manage/audit", label: "Audit log" }] : []),
  ];

  return (
    <>
      <SiteHeader />
      <div className="relative z-10 mx-auto grid w-full max-w-content gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[12.5rem_1fr] lg:py-12">
        <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
          <div className="hidden flex-col gap-1 px-3 lg:flex">
            <p className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-primary">Manage</p>
            <p className="text-[0.8125rem] text-muted">{scope}</p>
          </div>
          <SideNav items={items} label="Manage" />
        </aside>
        <main id="main" className="min-w-0">
          {children}
        </main>
      </div>
    </>
  );
}
