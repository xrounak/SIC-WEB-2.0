import Image, { type StaticImageData } from "next/image";
import type { ReactNode } from "react";
import { DEFAULT_THEME, type ThemeKey } from "./registry";
import { heroArt as diwali } from "./themes/diwali/hero";
import { heroArt as regular } from "./themes/regular/hero";

/**
 * Optional hero artwork per theme (./themes/<theme>/hero.ts). While that theme is
 * active, its artwork replaces the default text title; every other theme keeps the
 * text. Switching is pure CSS on <html data-theme>, so there is no flash. The site
 * default theme's artwork loads eagerly (it is the first thing most visitors see);
 * any other theme's artwork is lazy, so it only downloads when that theme is shown.
 */
const HERO_ART: Partial<Record<ThemeKey, { src: StaticImageData; alt: string; includesTitleText?: boolean }>> = {
  diwali,
  regular,
};

const css = Object.keys(HERO_ART)
  .map(
    (key) =>
      `[data-theme="${key}"] .hero-art[data-art="${key}"]{display:block}` +
      `[data-theme="${key}"] .hero-default,[data-theme="${key}"] .hero-default-inline{display:none}` +
      (HERO_ART[key as ThemeKey]?.includesTitleText ? `[data-theme="${key}"] .hero-subtitle{display:none}` : ""),
  )
  .join("");

export function ThemedHeroTitle({ fallback }: { fallback: ReactNode }) {
  return (
    <>
      <style>{`.hero-art{display:none}${css}`}</style>
      {Object.entries(HERO_ART).map(([key, art]) => (
        <div key={key} className="hero-art relative w-[min(94vw,68.75rem)]" data-art={key}>
          <span
            aria-hidden="true"
            className="absolute inset-[10%_15%] -z-10 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--color-primary)_30%,transparent),transparent)] blur-2xl"
          />
          <Image
            src={art.src}
            alt={art.alt}
            sizes="(max-width: 768px) 94vw, (min-width: 2400px) 1375px, 1100px"
            priority={key === DEFAULT_THEME}
            className="h-auto w-full select-none"
            draggable={false}
          />
          {!art.includesTitleText && (
            <p aria-hidden="true" className="hud-label -mt-2 text-[0.75rem] text-muted">
              Science &amp; Innovation Club
            </p>
          )}
        </div>
      ))}
      <div className="hero-default">{fallback}</div>
    </>
  );
}
