import gun from "./assets/cursor-gun.png";
import type { CursorSpec } from "../shared/cursor";

/** Pistol with fire and smoke from the muzzle; a click fires a bigger flash. */
export const cursor: CursorSpec = {
  image: gun,
  hotspot: [6, 5],
  trail: "fire",
  // The muzzle points up-left (barrel rotated 30°).
  direction: [-0.87, -0.5],
};
