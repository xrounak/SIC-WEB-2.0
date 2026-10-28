import settings from "./settings.json";
import diwali from "./themes/diwali/theme.json";
import christmas from "./themes/christmas/theme.json";
import independenceDay from "./themes/independence-day/theme.json";
import regular from "./themes/regular/theme.json";

/**
 * Layer 2: seasonal themes.
 *
 * Each theme lives in its own folder under ./themes/<theme>/:
 *   theme.json   colours, heading font, gradients, motion timings (from the design spec)
 *   overlay.tsx  decorations drawn behind the page
 *   artifacts.ts objects that fly across the screen (plane, reindeer, rocket…)
 *   assets/      the SVG files those use
 * Shared switching rules and token mapping are in ./settings.json.
 *
 * This module turns every theme.json into CSS custom properties under
 * [data-theme="<key>"]; the base UI only reads semantic tokens (--color-bg,
 * --color-primary, …), so switching a theme never touches layout or behaviour.
 */

const THEMES = { diwali, christmas, independenceDay, regular };

export type ThemeKey = keyof typeof THEMES;
type ThemeSpec = (typeof THEMES)[ThemeKey];

export const THEME_KEYS = settings.product.themeSwitching.supportedThemes.filter(
  (k): k is ThemeKey => k in THEMES,
);
export const STORAGE_KEY = "sic-active-theme";
export const FALLBACK_THEME: ThemeKey = "regular";

export function isThemeKey(value: unknown): value is ThemeKey {
  return typeof value === "string" && (THEME_KEYS as string[]).includes(value);
}

/** Site default before a visitor picks one. NEXT_PUBLIC_DEFAULT_THEME overrides the JSON. */
export const DEFAULT_THEME: ThemeKey = isThemeKey(process.env.NEXT_PUBLIC_DEFAULT_THEME)
  ? process.env.NEXT_PUBLIC_DEFAULT_THEME
  : isThemeKey(settings.product.themeSwitching.defaultTheme)
    ? settings.product.themeSwitching.defaultTheme
    : FALLBACK_THEME;

export function themeSpec(key: ThemeKey): ThemeSpec {
  return THEMES[key];
}

export const THEME_OPTIONS = THEME_KEYS.map((key) => {
  const t = themeSpec(key);
  return { key, label: t.label, description: t.description, swatch: [t.colors.primary, t.colors.accent, t.colors.background] };
});

/** JSON camelCase color name → CSS custom property, per implementation.cssTokenMapping. */
const TOKEN_FOR: Record<string, string> = Object.fromEntries(
  Object.entries(settings.implementation.cssTokenMapping).map(([cssVar, path]) => [path.replace("colors.", ""), cssVar]),
);

function kebab(s: string) {
  return s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}

/** Heading font per theme (theme.json fonts.heading); fonts are loaded in app/layout.tsx. */
const FONT_VARS: Record<string, string> = {
  Cinzel: "var(--font-cinzel)",
  Manrope: "var(--font-manrope)",
  Rajdhani: "var(--font-rajdhani)",
};
function headingFontVar(name: string) {
  return FONT_VARS[name] ?? "var(--font-cinzel)";
}

/** Builds the CSS for every theme's tokens. Injected once by the root layout. */
export function themeCss() {
  return THEME_KEYS.map((key) => {
    const t = themeSpec(key);
    const vars: string[] = [];
    for (const [name, value] of Object.entries(t.colors)) {
      vars.push(`${TOKEN_FOR[name] ?? `--color-${kebab(name)}`}:${value}`);
    }
    vars.push(`--font-heading-face:${headingFontVar(t.fonts.heading)}`);
    vars.push(`--theme-backdrop:${t.style.gradients.join(",")}`);
    for (const [name, ms] of Object.entries(t.motion.durationMs as Record<string, number>)) {
      vars.push(`--motion-${kebab(name)}:${ms}ms`);
    }
    return `[data-theme="${key}"]{${vars.join(";")}}`;
  }).join("\n");
}

/**
 * Runs before first paint: applies the stored theme (or the default) so there is
 * no flash, and falls back to "regular" when the stored key is invalid.
 */
export function themeBootScript() {
  return `(function(){try{var k=localStorage.getItem(${JSON.stringify(STORAGE_KEY)});var ok=${JSON.stringify(THEME_KEYS)};if(k!==null){document.documentElement.dataset.theme=ok.indexOf(k)>-1?k:${JSON.stringify(FALLBACK_THEME)};}}catch(e){}})();`;
}
