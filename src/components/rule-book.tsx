"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Long rule books open folded: the first part shows, the rest behind "View full rule
 * book". Jumping to a heading from the contents list unfolds it.
 */
export function Expandable({ children, long, label = "rule book" }: { children: ReactNode; long: boolean; label?: string }) {
  const [open, setOpen] = useState(!long);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unfoldForHash = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (id && box.current?.querySelector(`[id="${CSS.escape(id)}"]`)) setOpen(true);
    };
    unfoldForHash();
    window.addEventListener("hashchange", unfoldForHash);
    return () => window.removeEventListener("hashchange", unfoldForHash);
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <div ref={box} className={open ? "" : "rule-fold"}>
        {children}
      </div>
      {long && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="self-start rounded-lg border border-line-strong px-3 py-1.5 text-sm text-primary transition-colors hover:border-primary hover:bg-primary/10"
        >
          {open ? `Show less ↑` : `View full ${label} ↓`}
        </button>
      )}
    </div>
  );
}
