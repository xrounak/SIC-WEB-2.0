"use client";

import { useEffect } from "react";
import { prepareSfx, playSfx, setSfxActive } from "./themes/shared/sfx";
import { useMode } from "./use-mode";

const CLICKABLE =
  'a[href], button, summary, label, select, [role="button"], [role="tab"], [role="menuitem"], [role="menuitemradio"], input[type="checkbox"], input[type="radio"], input[type="submit"], input[type="button"]';
const TEXT_FIELD =
  'input:not([type="checkbox"]):not([type="radio"]):not([type="submit"]):not([type="button"]):not([type="range"]), textarea, [contenteditable="true"]';

/** Scroll distance that earns a swish, and the quiet time needed before the next one. */
const SCROLL_STEP = 700;

/**
 * Plays the active theme's sounds for clicks, typing and scrolling while the visitor
 * has "Theme + sound" on. Renders nothing. Page changes and flying objects trigger
 * their own sounds from PageTransition and the artifact layer.
 */
export function SfxController() {
  const mode = useMode();

  useEffect(() => {
    if (mode !== "sound") return;

    // Returning visitors: audio can only start after a gesture, so unlock on the first one.
    const unlock = () => void prepareSfx();
    window.addEventListener("pointerdown", unlock, { once: true, capture: true });
    window.addEventListener("keydown", unlock, { once: true, capture: true });

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const el = e.target as Element | null;
      if (!el?.closest?.(CLICKABLE) || el.closest("[data-no-sfx]")) return;
      playSfx("click");
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      if (!(e.target as Element | null)?.closest?.(TEXT_FIELD)) return;
      if (e.key === "Enter") playSfx("enter");
      else if (e.key === " ") playSfx("space");
      else if (e.key.length === 1 || e.key === "Backspace") playSfx("key");
    };

    let lastY = window.scrollY;
    let travelled = 0;
    const onScroll = () => {
      const y = window.scrollY;
      travelled += Math.abs(y - lastY);
      lastY = y;
      if (travelled >= SCROLL_STEP) {
        travelled = 0;
        playSfx("scroll");
      }
    };

    const onVisibility = () => setSfxActive(!document.hidden && document.hasFocus());

    window.addEventListener("pointerdown", onPointerDown, { capture: true, passive: true });
    window.addEventListener("keydown", onKeyDown, { capture: true, passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pointerdown", unlock, { capture: true });
      window.removeEventListener("keydown", unlock, { capture: true });
      window.removeEventListener("pointerdown", onPointerDown, { capture: true });
      window.removeEventListener("keydown", onKeyDown, { capture: true });
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [mode]);

  return null;
}
