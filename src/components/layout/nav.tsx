"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

export type NavItem = { href: string; label: string; exact?: boolean };

function isActive(pathname: string, item: NavItem) {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/**
 * Desktop HUD bar: pointed frame whose outline draws itself in on load, links that
 * stagger in, brackets on hover, a star over the active page, and a light scan
 * that passes across now and then. All CSS (see .hud-nav in globals.css).
 */
export function DesktopNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="hud-nav hidden lg:flex">
      <span className="hud-nav-wing" aria-hidden="true" />
      <div className="hud-nav-frame">
        <svg className="hud-nav-outline" viewBox="0 0 1000 44" preserveAspectRatio="none" aria-hidden="true">
          <path d="M16 1 H984 L999 22 L984 43 H16 L1 22 Z" pathLength={1} vectorEffect="non-scaling-stroke" />
        </svg>
        <span className="hud-nav-scan" aria-hidden="true" />
        <ul className="relative flex items-center">
          {items.map((item, i) => (
            <li key={item.href} style={{ ["--i" as string]: i }}>
              <Link href={item.href} aria-current={isActive(pathname, item) ? "page" : undefined} className="hud-nav-link">
                <span className="hud-nav-bracket" aria-hidden="true">[</span>
                {item.label}
                <span className="hud-nav-bracket" aria-hidden="true">]</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <span className="hud-nav-wing is-right" aria-hidden="true" />
    </nav>
  );
}

/** Full-screen menu for small screens with large staggered links. */
export function MobileNav({ items, footer }: { items: NavItem[]; footer?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((v) => !v)}
        className="menu-toggle relative inline-flex size-10 items-center justify-center"
        data-open={open}
      >
        <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
        <span className="menu-toggle-line" aria-hidden="true" />
        <span className="menu-toggle-line" aria-hidden="true" />
        <span className="menu-toggle-line" aria-hidden="true" />
      </button>
      {/* Portalled to <body> so the header's animated (transformed) wrapper can't contain it. */}
      {open &&
        createPortal(
        <div id="mobile-menu" className="mobile-menu fixed inset-x-0 bottom-0 top-16 z-40 flex flex-col overflow-y-auto bg-bg/95 px-6 pb-10 pt-6 backdrop-blur-lg">
          <nav aria-label="Main" className="flex flex-col">
            {items.map((item, i) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={isActive(pathname, item) ? "page" : undefined}
                className="mobile-menu-link group flex items-baseline gap-4 border-b border-line py-4"
                style={{ ["--i" as string]: i }}
              >
                <span className="hud-label text-[0.6875rem] text-subtle">{String(i + 1).padStart(2, "0")}</span>
                <span className="font-brand text-3xl font-bold text-fg transition-colors group-aria-[current=page]:text-primary">
                  {item.label}
                </span>
              </Link>
            ))}
          </nav>
          {footer && <div className="mt-6 flex flex-wrap gap-2">{footer}</div>}
          <p className="hud-label mt-auto pt-10 text-[0.6875rem] text-subtle">Science &amp; Innovation Club · GEC Palamu</p>
        </div>,
          document.body,
        )}
    </div>
  );
}

/** Vertical navigation for portal and manage areas; becomes a scrolling tab row on small screens. */
export function SideNav({ items, label }: { items: Array<NavItem & { badge?: number }>; label: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label={label} className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:overflow-visible lg:px-0">
      <ul className="flex gap-1 lg:flex-col">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={isActive(pathname, item) ? "page" : undefined}
              className={cn(
                "flex items-center justify-between gap-3 whitespace-nowrap rounded-lg px-3 py-2 text-sm text-muted transition-colors",
                "hover:bg-surface-2 hover:text-fg aria-[current=page]:bg-surface-2 aria-[current=page]:text-fg",
              )}
            >
              {item.label}
              {item.badge ? (
                <span className="rounded-full bg-primary px-1.5 font-mono text-[0.625rem] leading-[1.125rem] text-on-primary">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
