import type { ThemeSounds } from "../shared/sfx";

/** Crisp and firm: latch clicks, a jet whoosh, a drum when the page lands. */
export const sounds: ThemeSounds = {
  click: { id: "click-latch-medium", gain: 0.7, rate: [0.95, 1.08] },
  key: { id: "keyboard-letter-medium", gain: 0.55, rate: [0.95, 1.07] },
  scroll: { id: "swish-soft", gain: 0.3 },
  flyby: { id: "whoosh-slow-medium", gain: 0.55 },
  page: { id: "whoosh-medium-hard", gain: 0.6 },
  pageReveal: { id: "cinematic-drum-big", gain: 0.3 },
};
