import sparkler from "./assets/cursor-sparkler.png";
import type { CursorSpec } from "../shared/cursor";

/** Sparkler stick that keeps fizzing gold sparks from its tip. */
export const cursor: CursorSpec = {
  image: sparkler,
  hotspot: [5, 5],
  trail: "sparkle",
};
