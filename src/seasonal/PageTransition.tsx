"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { usePathname } from "next/navigation";
import rocket from "./themes/diwali/assets/rocket.svg";
import sleigh from "./themes/christmas/assets/reindeer-sleigh.svg";
import plane from "./themes/independence-day/assets/plane.svg";
import car from "./themes/regular/assets/car.svg";
import { ThemeSpinner } from "./ThemeSpinner";

/**
 * Page-switch transition: two banks of cloud close in from the sides while the
 * theme's craft flies across (rocket, sleigh, plane or car), then part to reveal
 * the new page. Starts on a click on an internal link to another page and ends
 * when the route has changed (at least MIN_COVER_MS so it never just flashes).
 * Colours and craft come from CSS on <html data-theme> (seasonal.css). Off for
 * reduced motion.
 */
const MIN_COVER_MS = 650;
const REVEAL_MS = 650;
const MAX_COVER_MS = 8000;

const CRAFT = [
  { theme: "diwali", src: rocket },
  { theme: "christmas", src: sleigh },
  { theme: "independenceDay", src: plane },
  { theme: "regular", src: car },
];

// Smoke puffs spread through each bank, denser toward the middle of the screen.
// Deterministic so server and client agree: [left %, top %, size vw, drift seconds].
const PUFFS: Array<[number, number, number, number]> = Array.from({ length: 14 }, (_, i) => [
  20 + ((i * 41) % 90),
  -15 + ((i * 29) % 110),
  22 + ((i * 17) % 22),
  5 + ((i * 7) % 5),
]);

type Phase = "idle" | "cover" | "reveal";

export function PageTransition() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>("idle");
  const phaseRef = useRef<Phase>("idle");
  const startedAt = useRef(0);
  const timers = useRef<number[]>([]);

  const go = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);
  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);
  const reveal = useCallback(() => {
    clearTimers();
    go("reveal");
    timers.current.push(window.setTimeout(() => go("idle"), REVEAL_MS));
  }, [clearTimers, go]);

  // Cover on clicks to another page of this site.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      if (url.pathname.startsWith("/api") || /\.[a-z0-9]+$/i.test(url.pathname)) return;
      clearTimers();
      startedAt.current = performance.now();
      go("cover");
      timers.current.push(window.setTimeout(reveal, MAX_COVER_MS));
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [clearTimers, go, reveal]);

  // Reveal once the new route is in.
  useEffect(() => {
    if (phaseRef.current !== "cover") return;
    const wait = Math.max(0, MIN_COVER_MS - (performance.now() - startedAt.current));
    timers.current.push(window.setTimeout(reveal, wait));
  }, [pathname, reveal]);

  useEffect(() => clearTimers, [clearTimers]);

  return (
    <div className="page-transition" data-phase={phase} aria-hidden="true">
      <div className="pt-veil" />
      {(["left", "right"] as const).map((side) => (
        <div key={side} className={`pt-bank pt-${side}`}>
          {PUFFS.map(([left, top, size, drift], i) => (
            <i
              key={i}
              style={
                {
                  left: `${left}%`,
                  top: `${top}%`,
                  width: `${size}vw`,
                  height: `${size * 0.7}vw`,
                  animationDuration: `${drift}s`,
                  animationDelay: `${-i * 0.7}s`,
                } as CSSProperties
              }
            />
          ))}
        </div>
      ))}
      <div className="pt-center">
        <span className="pt-craft">
          {CRAFT.map((c) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={c.theme} className={`pt-art pt-art-${c.theme}`} src={c.src.src} alt="" loading="lazy" draggable={false} />
          ))}
        </span>
        <span className="pt-status">
          <ThemeSpinner />
          Loading
        </span>
      </div>
    </div>
  );
}
