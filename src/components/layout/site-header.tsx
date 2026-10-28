import Link from "next/link";
import { getViewer } from "@/lib/auth";
import { signOut } from "@/lib/actions/auth";
import { ButtonLink } from "@/components/ui/button";
import { Avatar } from "@/components/ui/primitives";
import { Logo } from "./logo";
import { HeaderScrollState } from "./header-scroll";
import { DesktopNav, MobileNav, type NavItem } from "./nav";
import { ThemeSwitcher } from "@/seasonal/ThemeSwitcher";
import { DEFAULT_THEME } from "@/seasonal/registry";

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
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg p-1 pr-2 hover:bg-surface-2 [&::-webkit-details-marker]:hidden">
        <Avatar name={viewer.profile.full_name || viewer.profile.email} src={viewer.profile.avatar_url} size={30} />
        <span className="hidden max-w-32 truncate text-sm sm:block">{viewer.profile.full_name || "Account"}</span>
      </summary>
      <div className="absolute right-0 top-11 z-50 w-56 rounded-xl border border-line bg-surface p-1.5 shadow-card">
        <p className="truncate px-3 py-2 text-[0.8125rem] text-subtle">{viewer.profile.email}</p>
        <Link href="/portal" className="block rounded-lg px-3 py-2 text-sm hover:bg-surface-2">
          My portal
        </Link>
        {viewer.canManage && (
          <Link href="/manage" className="block rounded-lg px-3 py-2 text-sm hover:bg-surface-2">
            Manage
          </Link>
        )}
        <Link href="/portal/profile" className="block rounded-lg px-3 py-2 text-sm hover:bg-surface-2">
          Profile
        </Link>
        <form action={signOut}>
          <button type="submit" className="block w-full rounded-lg px-3 py-2 text-left text-sm text-muted hover:bg-surface-2 hover:text-fg">
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
    <header className="site-header sticky top-0 z-40 h-16">
      <HeaderScrollState />
      <div className="relative mx-auto flex h-full w-full max-w-content items-center justify-between gap-4 px-4 sm:px-6">
        <div className="header-enter" style={{ ["--i" as string]: 0 }}>
          <Logo />
        </div>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <DesktopNav items={PUBLIC_NAV} />
        </div>
        <div className="header-enter flex items-center gap-1.5" style={{ ["--i" as string]: 2 }}>
          <ThemeSwitcher serverTheme={DEFAULT_THEME} />
          {account}
          <MobileNav items={PUBLIC_NAV} />
        </div>
      </div>
      <span className="site-header-glint" aria-hidden="true" />
    </header>
  );
}
