"use client";

import { useSyncExternalStore } from "react";
import { DEFAULT_THEME, FALLBACK_THEME, MODE_KEY, isMode, type Mode } from "./registry";

/**
 * The visitor's one switch, kept on <html data-mode>:
 *   off    no seasonal theme: the plain default look (the "regular" theme), no sound
 *   theme  the theme the developer chose (settings.json / NEXT_PUBLIC_DEFAULT_THEME)
 *   sound  that theme plus its sound effects
 * <html data-theme> follows from it, so the theme CSS and decorations keep working.
 */
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-mode"] });
  return () => observer.disconnect();
}

export function readMode(): Mode {
  const value = document.documentElement.dataset.mode;
  return isMode(value) ? value : "theme";
}

/** Current mode on the client. `serverValue` is what the server rendered. */
export function useMode(serverValue: Mode = "theme"): Mode {
  return useSyncExternalStore<Mode>(subscribe, readMode, () => serverValue);
}

export function setMode(mode: Mode) {
  const root = document.documentElement;
  root.dataset.mode = mode;
  root.dataset.theme = mode === "off" ? FALLBACK_THEME : DEFAULT_THEME;
  try {
    localStorage.setItem(MODE_KEY, mode);
  } catch {
    // Private mode or blocked storage: the change still applies for this visit.
  }
}
