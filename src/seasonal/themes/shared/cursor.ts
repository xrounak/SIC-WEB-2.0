import type { StaticImageData } from "next/image";

/**
 * A theme's mouse cursor and the trail that follows it. The cursor is a plain CSS
 * cursor (src/seasonal/ThemeCursor.tsx); the trail is drawn by ./cursor-trail.tsx.
 * Mouse and trackpad only; text fields keep the text cursor.
 *
 * Trails
 *   sparkle  gold sparks that keep fizzing from the tip, like a lit sparkler
 *   candy    peppermints that pop out and tumble down
 *   fire     flame and smoke from the muzzle; clicking fires a bigger flash
 */
export type CursorSpec = {
  /** 32×32 PNG in the theme's assets folder, drawn so the tip is the hotspot. */
  image: StaticImageData;
  /** Pixel inside the 32×32 image that is the click point. */
  hotspot: [number, number];
  trail: "sparkle" | "candy" | "fire";
  /** Unit vector the fire shoots toward (fire trail). Default up-left. */
  direction?: [number, number];
  /** Where particles appear relative to the hotspot, in px. */
  emitOffset?: [number, number];
};
