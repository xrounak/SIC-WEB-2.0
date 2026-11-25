import type { ThemeSounds } from "../shared/sfx";

/**
 * Sleigh bells and glockenspiel. The xmas-* files are original sounds synthesised by
 * scripts/synth-christmas-sfx.mjs (CC0); the rest are from SFX Kit (CC0).
 */
export const sounds: ThemeSounds = {
  click: { id: "xmas-jingle-click", gain: 0.4, rate: [0.9, 1.12] },
  key: { id: "keyboard-letter-soft", gain: 0.55, rate: [0.94, 1.08] },
  scroll: { id: "xmas-jingle-shimmer", gain: 0.22, rate: [0.95, 1.05] },
  flyby: { id: "xmas-sleigh-bells", gain: 0.5, rate: [0.97, 1.03] },
  page: { id: "whoosh-medium-soft", gain: 0.7 },
  pageReveal: { id: "xmas-chime-reveal", gain: 0.5 },
};
