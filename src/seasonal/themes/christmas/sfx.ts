import type { ThemeSounds } from "../shared/sfx";

/** Sleigh bells and sparkle. */
export const sounds: ThemeSounds = {
  click: { id: "shimmer-short-sparkle", gain: 0.45, rate: [0.92, 1.12] },
  key: { id: "keyboard-letter-soft", gain: 0.55, rate: [0.94, 1.08] },
  scroll: { id: "whoosh-fast-soft", gain: 0.3 },
  flyby: { id: "props-shop-bell", gain: 0.5 },
  page: { id: "whoosh-medium-soft", gain: 0.7 },
  pageReveal: { id: "shimmer-medium-soft", gain: 0.55 },
};
