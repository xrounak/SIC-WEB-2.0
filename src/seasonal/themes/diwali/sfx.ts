import type { ThemeSounds } from "../shared/sfx";

/** Warm and glassy: a diya clink for clicks, soft airy swishes, a real firework for rockets. */
export const sounds: ThemeSounds = {
  click: { id: "foley-glass-touch", gain: 0.5, rate: [0.9, 1.15] },
  key: { id: "keyboard-letter-soft", gain: 0.55, rate: [0.94, 1.08] },
  scroll: { id: "whoosh-fast-soft", gain: 0.3 },
  burst: { id: "celebration-fireworks", gain: 0.75, leadMs: 989 },
  page: { id: "whoosh-medium-soft", gain: 0.7 },
  pageReveal: { id: "shimmer-short-soft", gain: 0.6 },
};
