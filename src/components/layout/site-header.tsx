import Link from "next/link";
import { getViewer } from "@/lib/auth";
import { signOut } from "@/lib/actions/auth";
import { ButtonLink } from "@/components/ui/button";
import { Avatar } from "@/components/ui/primitives";
import { Logo } from "./logo";
import { HeaderScrollState } from "./header-scroll";
import { DesktopNav, MobileNav, type NavItem } from "./nav";
import { ModeToggle } from "@/seasonal/ModeToggle";

const PUBLIC_NAV: NavItem[] = [
  { href: "/events", label: "Events" },
  { href: "/projects", label: "Projects" },
  { href: "/domains", label: "Domains" },
  { href: "/about", label: "About" },
  { href: "/join", label: "Join" },
  { href: "/contact", label: "Contact" },
];

/** Shared top bar for public, portal and manage areas. */
export async function SiteHeader() {
  const viewer = await getViewer();

  const account = viewer ? (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full p-0.5 pr-2.5 ring-1 ring-line-strong transition-colors hover:ring-primary [&::-webkit-details-marker]:hidden sm:pr-3">
        <Avatar name={viewer.profile.full_name || viewer.profile.email} src={viewer.profile.avatar_url} size={30} />
        <span className="hidden max-w-32 truncate text-sm sm:block">{viewer.profile.full_name || "Account"}</span>
      </summary>
      <div className="hdr-menu absolute right-0 top-12 z-50 w-56 p-1.5">
        <p className="truncate px-3 py-2 text-[0.8125rem] text-subtle">{viewer.profile.email}</p>
        <Link href="/portal" className="block px-3 py-2 text-sm hover:bg-primary/10 hover:text-primary">
          My portal
        </Link>
        {viewer.canManage && (
          <Link href="/manage" className="block px-3 py-2 text-sm hover:bg-primary/10 hover:text-primary">
            Manage
          </Link>
        )}
        <Link href="/portal/profile" className="block px-3 py-2 text-sm hover:bg-primary/10 hover:text-primary">
          Profile
        </Link>
        <form action={signOut}>
          <button type="submit" className="block w-full px-3 py-2 text-left text-sm text-muted hover:bg-primary/10 hover:text-fg">
            Sign out
          </button>
        </form>
      </div>
    </details>
  ) : (
    <ButtonLink href="/login" size="sm" variant="secondary">
      Sign in
    </ButtonLink>
  );

  return (
    <header className="site-header sticky top-0 z-40">
      <HeaderScrollState />
      <div className="hdr-plate" aria-hidden="true" />
      <span className="hdr-tick is-cut-l" aria-hidden="true" />
      <span className="hdr-tick is-cut-r" aria-hidden="true" />
      <span className="hdr-tick is-notch" aria-hidden="true" />
      <span className="hdr-tick is-notch-l" aria-hidden="true" />
      <span className="hdr-tick is-notch-r" aria-hidden="true" />
      <span className="hdr-bracket is-l" aria-hidden="true" />
      <span className="hdr-bracket is-r" aria-hidden="true" />
      <div className="relative mx-auto flex h-full w-full max-w-content items-center justify-between gap-3 px-4 pb-[3px] sm:px-6">
        <div className="header-enter" style={{ ["--i" as string]: 0 }}>
          <Logo />
        </div>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[55%]">
          <DesktopNav items={PUBLIC_NAV} />
        </div>
        <div className="header-enter flex items-center gap-1.5" style={{ ["--i" as string]: 2 }}>
          <ModeToggle />
          {account}
          <MobileNav items={PUBLIC_NAV} />
        </div>
      </div>
    </header>
  );
}
