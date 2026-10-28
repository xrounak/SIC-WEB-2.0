import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { ThemeKey } from "../registry";

// One overlay per theme folder. Lazy-loaded, so a theme's artwork and artifacts
// only download when that theme is active.
export const OVERLAYS: Record<ThemeKey, ComponentType> = {
  diwali: dynamic(() => import("./diwali/overlay").then((m) => m.DiwaliOverlay), { ssr: false }),
  christmas: dynamic(() => import("./christmas/overlay").then((m) => m.ChristmasOverlay), { ssr: false }),
  independenceDay: dynamic(() => import("./independence-day/overlay").then((m) => m.IndependenceOverlay), { ssr: false }),
  regular: dynamic(() => import("./regular/overlay").then((m) => m.RegularOverlay), { ssr: false }),
};
