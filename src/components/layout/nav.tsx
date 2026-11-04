"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import { buttonClass } from "@/components/ui/button";

export type NavItem = { href: string; label: string; exact?: boolean };

function isActive(pathname: string, item: NavItem) {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/**
 * Desktop links: set directly on the glass header, separated by slashes. Hover
 * shows brackets; the current page is a lit tag. All CSS (.hdr-nav in globals.css).
 */
export function DesktopNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="hdr-nav hidden lg:block">
      <ul>
        {items.map((item, i) => (
          <li key={item.href} style={{ ["--i" as string]: i }}>
            <Link href={item.href} aria-current={isActive(pathname, item) ? "page" : undefined} className="hdr-link">
              <span className="hdr-bracket-char" aria-hidden="true">[</span>
              {item.label}
              <span className="hdr-bracket-char" aria-hidden="true">]</span>
            </Link>
          </li>
        ))}
      </ul>
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
        className={buttonClass("secondary", "sm", "menu-toggle relative size-10 px-0")}
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
        <div id="mobile-menu" className="mobile-menu fixed inset-x-0 bottom-0 top-16 z-40 flex flex-col overflow-y-auto bg-bg/80 px-6 pb-10 pt-6 backdrop-blur-xl">
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
  const strip = useRef<HTMLElement>(null);

  // On phones the links form a scrolling strip: keep the current page centred in it.
  useEffect(() => {
    const el = strip.current;
    const current = el?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!el || !current || el.scrollWidth <= el.clientWidth) return;
    el.scrollTo({ left: current.offsetLeft - (el.clientWidth - current.offsetWidth) / 2, behavior: "smooth" });
  }, [pathname]);

  return (
    <nav
      ref={strip}
      aria-label={label}
      className="side-strip sticky top-16 z-30 -mx-4 overflow-x-auto border-b border-line bg-bg/80 px-4 backdrop-blur-xl lg:static lg:mx-0 lg:overflow-visible lg:border-0 lg:bg-transparent lg:px-0 lg:backdrop-blur-none"
    >
      <ul className="flex gap-1 py-1.5 lg:flex-col lg:py-0">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={isActive(pathname, item) ? "page" : undefined}
              className={cn(
                "flex items-center justify-between gap-3 whitespace-nowrap px-3 py-2.5 text-sm text-muted transition-colors lg:rounded-lg lg:py-2",
                "hover:bg-surface-2 hover:text-fg aria-[current=page]:bg-primary/15 aria-[current=page]:text-fg max-lg:aria-[current=page]:shadow-[inset_0_-2px_0_var(--color-primary)] lg:aria-[current=page]:bg-surface-2",
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
