"use client";

import { useEffect, useRef, useState } from "react";

/** Who built the website: the name opens a small card with their profiles. */

const LINKS = [
  {
    label: "Instagram",
    handle: "@unknowngmr02",
    href: "https://www.instagram.com/unknowngmr02/",
    icon: "M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm5 3.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Zm0 2a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM17.5 5.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z",
  },
  {
    label: "LinkedIn",
    handle: "rounak-kumar-unknown",
    href: "https://www.linkedin.com/in/rounak-kumar-unknown/",
    icon: "M4 3a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm-2 6h4v12H2V9Zm7 0h3.8v1.7h.1c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6V21h-4v-5.6c0-1.3 0-3-1.9-3s-2.1 1.4-2.1 2.9V21H9V9Z",
  },
  {
    label: "GitHub",
    handle: "xrounak",
    href: "https://github.com/xrounak",
    icon: "M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.4-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.3-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.8 1a9.6 9.6 0 0 1 5 0c1.9-1.3 2.8-1 2.8-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.9V21c0 .3.2.6.7.5A10 10 0 0 0 12 2Z",
  },
];

export function Credit() {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: PointerEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  return (
    <span ref={wrap} className="relative inline-flex items-baseline gap-1.5">
      <span>Website by</span>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((v) => !v)}
        className="text-primary underline decoration-dotted underline-offset-4 hover:text-primary-hover"
      >
        Rounak Kumar
      </button>
      {open && (
        <span
          role="dialog"
          aria-label="Rounak Kumar's profiles"
          className="absolute bottom-[calc(100%+0.75rem)] right-0 z-50 flex w-64 flex-col gap-2 border border-line bg-surface p-3 normal-case tracking-normal text-fg shadow-2xl sm:left-1/2 sm:right-auto sm:-translate-x-1/2"
        >
          <span className="flex items-center gap-3 border-b border-line pb-2.5">
            <span className="grid h-10 w-10 place-items-center bg-primary font-brand text-sm font-black text-bg" aria-hidden="true">
              RK
            </span>
            <span className="flex flex-col">
              <span className="font-brand text-base font-black uppercase">Rounak Kumar</span>
              <span className="text-xs text-muted">Designed &amp; built this website</span>
            </span>
          </span>
          {LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 border border-line px-3 py-2 transition-colors hover:border-primary hover:bg-primary/10"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-primary" aria-hidden="true">
                <path d={l.icon} fill="currentColor" />
              </svg>
              <span className="flex min-w-0 flex-col">
                <span className="hud-label text-[0.625rem] text-subtle">{l.label}</span>
                <span className="truncate text-sm">{l.handle}</span>
              </span>
              <span aria-hidden="true" className="ml-auto text-subtle transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                ↗
              </span>
            </a>
          ))}
        </span>
      )}
    </span>
  );
}
