import type { ThemeSounds } from "../shared/sfx";

/** Clean interface sounds. */
export const sounds: ThemeSounds = {
  click: { id: "click-button-medium", gain: 0.65, rate: [0.96, 1.05] },
  key: { id: "keyboard-letter-medium", gain: 0.55, rate: [0.95, 1.07] },
  scroll: { id: "swish-soft", gain: 0.25 },
  flyby: { id: "whoosh-fast-medium", gain: 0.4 },
  page: { id: "whoosh-medium-medium", gain: 0.6 },
  pageReveal: { id: "pop-medium-in", gain: 0.6 },
};
