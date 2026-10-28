import type { ThemeKey } from "./registry";
import type { CursorSpec } from "./themes/shared/cursor";
import { cursor as diwali } from "./themes/diwali/cursor";
import { cursor as christmas } from "./themes/christmas/cursor";
import { cursor as independenceDay } from "./themes/independence-day/cursor";
import { cursor as regular } from "./themes/regular/cursor";

/** Each theme's cursor, from ./themes/<theme>/cursor.ts (null = system cursor). */
export const CURSORS: Record<ThemeKey, CursorSpec | null> = { diwali, christmas, independenceDay, regular };

/**
 * CSS that swaps the cursor image per theme. Mouse/trackpad only; text fields keep
 * the text cursor. The browser fetches a cursor image only for the active theme.
 */
export function ThemeCursorStyles() {
  const rules = Object.entries(CURSORS)
    .filter((entry): entry is [string, CursorSpec] => entry[1] !== null)
    .map(([key, c]) => {
      const url = `url("${c.image.src}") ${c.hotspot[0]} ${c.hotspot[1]}`;
      const t = `[data-theme="${key}"]`;
      return (
        `${t},${t} body{cursor:${url},auto}` +
        `${t} a,${t} button,${t} summary,${t} label,${t} select,${t} [role="button"],${t} [role="menuitemradio"],${t} [role="tab"]{cursor:${url},pointer}`
      );
    })
    .join("");
  const css =
    `@media (hover:hover) and (pointer:fine){${rules}` +
    `[data-theme] input:not([type="checkbox"]):not([type="radio"]):not([type="submit"]):not([type="button"]),[data-theme] textarea,[data-theme] [contenteditable="true"]{cursor:text}}`;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
