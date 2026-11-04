import { SiteHeader } from "@/components/layout/site-header";
import { SideNav } from "@/components/layout/nav";
import { Card, PageHeader } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";

// TEMPORARY: reproduces the portal layout to hunt a sideways overflow. Deleted after.
export default function Preview() {
  const items = [
    { href: "/dev-preview", label: "Overview", exact: true },
    { href: "/portal/registrations", label: "Registrations" },
    { href: "/portal/applications", label: "Applications" },
    { href: "/portal/notifications", label: "Notifications", badge: 3 },
    { href: "/portal/proposals", label: "Event proposals" },
    { href: "/portal/projects", label: "Projects" },
    { href: "/portal/teams", label: "My teams" },
    { href: "/portal/notices", label: "Notices" },
    { href: "/portal/profile", label: "Profile" },
  ];
  return (
    <>
      <SiteHeader />
      <div className="relative z-10 mx-auto grid w-full max-w-content gap-4 px-4 py-4 sm:gap-6 sm:px-6 sm:py-8 lg:grid-cols-[12.5rem_1fr] lg:gap-8 lg:py-12">
        <aside className="max-lg:contents lg:sticky lg:top-24 lg:flex lg:flex-col lg:gap-4 lg:self-start">
          <SideNav items={items} label="Portal" />
        </aside>
        <main id="main" className="min-w-0">
          <PageHeader eyebrow="Portal" title="Hi, Ujjawal" description="Here's what's happening in the club." actions={<ButtonLink href="#" size="sm" variant="secondary">Browse events</ButtonLink>} />
          <Card className="mt-6 p-5">Card</Card>
        </main>
      </div>
    </>
  );
}
