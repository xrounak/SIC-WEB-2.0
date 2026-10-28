"use client";

import { useSyncExternalStore } from "react";
import { FALLBACK_THEME, STORAGE_KEY, isThemeKey, type ThemeKey } from "./registry";

/** Watches <html data-theme>, the one place the active theme lives. */
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

function read(): ThemeKey {
  const value = document.documentElement.dataset.theme;
  return isThemeKey(value) ? value : FALLBACK_THEME;
}

/**
 * Current theme on the client. `serverValue` is what the server rendered; pass null
 * for UI that should only appear after hydration (decorations).
 */
export function useActiveTheme<T extends ThemeKey | null>(serverValue: T): ThemeKey | T {
  return useSyncExternalStore<ThemeKey | T>(subscribe, read, () => serverValue);
}

/** Switches theme instantly, without a reload, and remembers it in this browser. */
export function setActiveTheme(key: ThemeKey) {
  document.documentElement.dataset.theme = key;
  try {
    localStorage.setItem(STORAGE_KEY, key);
  } catch {
    // Private mode or blocked storage: the switch still applies for this visit.
  }
}
