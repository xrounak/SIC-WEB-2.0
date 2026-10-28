import cane from "./assets/cursor-candy-cane.png";
import type { CursorSpec } from "../shared/cursor";

/** Candy cane pointer that drops peppermints as it moves. */
export const cursor: CursorSpec = {
  image: cane,
  hotspot: [3, 3],
  trail: "candy",
};
