"use client";

import { useEffect } from "react";
import { OVERLAYS } from "./themes";
import { useActiveTheme } from "./use-active-theme";

/**
 * Slot the base layout renders once. Decorations load lazily per theme, render
 * only in the browser, sit behind content (aria-hidden, pointer-events: none),
 * and pause while the tab is hidden.
 */
export function SeasonalLayer() {
  const theme = useActiveTheme(null);

  useEffect(() => {
    const sync = () => {
      document.documentElement.dataset.pageHidden = document.hidden ? "true" : "false";
    };
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  const Overlay = theme ? OVERLAYS[theme] : undefined;
  return Overlay ? <Overlay /> : null;
}
