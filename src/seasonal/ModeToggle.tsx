"use client";

import type { ReactNode } from "react";
import { DEFAULT_THEME, MODES, themeSpec, type Mode } from "./registry";
import { playSfx, prepareSfx } from "./themes/shared/sfx";
import { setMode, useMode } from "./use-mode";
import { buttonClass } from "@/components/ui/button";

const icon = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const ICONS: Record<Mode, ReactNode> = {
  // Circle with a slash
  off: icon(
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M6.5 17.5l11-11" />
    </>,
  ),
  // Four-point star
  theme: icon(<path d="M12 3l2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2z" />),
  // Speaker with waves
  sound: icon(
    <>
      <path d="M4 10v4h3.5L12 18V6L7.5 10z" />
      <path d="M15.5 9a4 4 0 010 6M18 6.5a7.5 7.5 0 010 11" />
    </>,
  ),
};

const NEXT: Record<Mode, Mode> = { off: "theme", theme: "sound", sound: "off" };

/**
 * The single header switch: off (default look) → theme on (the developer's pick,
 * currently {DEFAULT_THEME}) → theme and sound. Each press moves to the next state.
 */
export function ModeToggle() {
  const mode = useMode();
  const themeName = themeSpec(DEFAULT_THEME).label;
  const label: Record<Mode, string> = { off: "Theme off", theme: `${themeName} theme`, sound: `${themeName} + sound` };
  const short: Record<Mode, string> = { off: "Off", theme: "Theme", sound: "Theme + sound" };

  const press = async () => {
    const next = NEXT[mode];
    if (next === "sound") {
      // The press is the gesture that unlocks audio; load first so the confirmation is heard.
      setMode(next);
      await prepareSfx();
      playSfx("toggleOn");
      return;
    }
    if (mode === "sound") playSfx("toggleOff");
    setMode(next);
  };

  return (
    <button
      type="button"
      data-no-sfx
      onClick={press}
      aria-label={`Seasonal look and sound: ${label[mode]}. Press to change.`}
      title={`${label[mode]}. Press to change: off, theme, theme + sound.`}
      className={buttonClass("ghost", "sm", "gap-2 px-2.5")}
    >
      {ICONS[mode]}
      <span className="hidden 2xl:inline">{short[mode]}</span>
      <span className="hidden gap-0.5 sm:flex" aria-hidden="true">
        {MODES.map((m) => (
          <i key={m} className={`h-1.5 w-1.5 rounded-full ${m === mode ? "bg-primary" : "bg-line-strong"}`} />
        ))}
      </span>
    </button>
  );
}
