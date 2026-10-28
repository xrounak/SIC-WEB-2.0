"use client";

import { useEffect, useRef, useState } from "react";
import { THEME_OPTIONS, type ThemeKey } from "./registry";
import { setActiveTheme, useActiveTheme } from "./use-active-theme";
import { cn } from "@/lib/cn";

function Swatch({ colors, size = 14 }: { colors: string[]; size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="inline-block shrink-0 rounded-full border border-white/15"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${colors[0]} 0 50%, ${colors[1]} 50% 75%, ${colors[2]} 75% 100%)`,
      }}
    />
  );
}

/** One-click theme picker for the header. Changes tokens and decorations only. */
export function ThemeSwitcher({ serverTheme }: { serverTheme: ThemeKey }) {
  const active = useActiveTheme(serverTheme);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = THEME_OPTIONS.find((o) => o.key === active) ?? THEME_OPTIONS[0];

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls="theme-menu"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 items-center gap-2 rounded-lg px-2.5 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-fg"
      >
        <Swatch colors={current.swatch} />
        <span className="hidden md:inline">{current.label}</span>
        <span className="sr-only md:hidden">Theme: {current.label}</span>
      </button>
      {open && (
        <div
          id="theme-menu"
          role="menu"
          aria-label="Site theme"
          className="absolute right-0 top-11 z-50 w-64 rounded-xl border border-line bg-surface p-1.5 shadow-card"
        >
          <p className="px-3 pb-1.5 pt-2 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-subtle">Theme</p>
          {THEME_OPTIONS.map((o) => (
            <button
              key={o.key}
              type="button"
              role="menuitemradio"
              aria-checked={o.key === active}
              onClick={() => {
                setActiveTheme(o.key);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-surface-2",
                o.key === active && "bg-surface-2",
              )}
            >
              <Swatch colors={o.swatch} size={18} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-sm font-medium">{o.label}</span>
                <span className="line-clamp-2 text-[0.75rem] leading-snug text-subtle">{o.description}</span>
              </span>
              {o.key === active && (
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0 text-primary" aria-hidden="true">
                  <path d="M5 12l5 5L20 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
