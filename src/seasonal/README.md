# Seasonal themes

Every theme lives in its own folder. Switching themes changes only colours,
decorations and artifacts — never layout, content or behaviour.

```
src/seasonal/
  settings.json            switching rules, token mapping (from the design spec)
  registry.ts              turns each theme.json into CSS variables
  themes/
    shared/                building blocks used by every theme
      layers.tsx           BackLayer, TopBand, HeroBand, StringLights, Glow
      artifacts.tsx        the flying-artifact engine
    diwali/
      theme.json           colours, heading font, gradients, motion timings
      overlay.tsx          diyas, string lights, lanterns, glows
      artifacts.ts         rockets with sparkle trails and bursts
      hero.ts              optional artwork that replaces the home-page title
      cursor.ts            cursor image + trail (sparkler, sparks)
      assets/rocket.svg, assets/hero-logo.webp, assets/cursor-sparkler.svg
    christmas/
      theme.json
      overlay.tsx          snowflakes, candy cane, evergreen sprig, lights
      artifacts.ts         reindeer and sleigh with a stardust trail
      assets/reindeer-sleigh.svg
    independence-day/
      theme.json
      overlay.tsx          tricolour ribbon, Ashoka Chakra watermark, confetti
      artifacts.ts         three-jet formation with tricolour smoke
      assets/plane.svg
    regular/
      theme.json           neutral; no overlay, no artifacts
```

## Replacing an artifact with your own SVG

Drop your file into the theme's `assets/` folder **with the same file name** and
reload. Nothing else needs to change.

| Theme | File | Draw it |
|---|---|---|
| Diwali | `diwali/assets/rocket.svg` | Pointing **up**, tall and narrow (about 1 : 3) |
| Christmas | `christmas/assets/reindeer-sleigh.svg` | Facing **right** (reindeer on the right), wide (about 3 : 1) |
| Independence Day | `independence-day/assets/plane.svg` | Facing **right** (nose on the right), side view, about 3 : 1 |

Tips for SVGs that look good here:

- Keep a `viewBox` and remove fixed `width`/`height` attributes; the size is set in `artifacts.ts`.
- Use flat fills and no embedded raster images. Aim for under 10 KB.
- Leave little or no empty margin inside the `viewBox`; trails attach to the edges.
- Light colours read best: every theme has a dark background.

## Home-page artwork per theme

A theme can replace the bold "SIC." title with its own artwork: add `hero.ts`
(see `diwali/hero.ts`) and register it in `src/seasonal/HeroArt.tsx`. Use a
transparent WebP or PNG, about 1600 px wide, with the subtitle text left out (the
page renders it as real text). The default theme's artwork loads immediately;
others load only when shown.

## Custom cursor and trail

Each theme's `cursor.ts` sets a plain CSS cursor image and the trail that follows it:

| Theme | Cursor | Trail |
|---|---|---|
| Diwali | `assets/cursor-sparkler.png` | `sparkle`: gold sparks fizzing from the tip; click for a burst |
| Christmas | `assets/cursor-candy-cane.png` | `candy`: peppermints pop out and tumble; click for a handful |
| Independence Day | `assets/cursor-gun.png` | `fire`: flame and smoke from the muzzle; click for a muzzle flash |
| Regular | system cursor | none |

The cursor is a 32x32 PNG; the `.svg` next to it is the source art. To use your own
art, draw a 32x32 SVG with the tip in the top-left area and export it:

    node -e "require('sharp')('in.svg').resize(32,32).png().toFile('out.png')"

Set `hotspot` in `cursor.ts` to the click pixel. For the fire trail, `direction` is
the way the muzzle points. Cursor and trail apply to mouse and trackpad only; text
fields keep the text cursor, and the trail is off for reduced motion.

## Adding a new artifact

Add an entry to the theme's `artifacts.ts`:

```ts
import balloon from "./assets/balloon.svg";

{
  id: "balloon",
  src: balloon,
  width: 60,              // px
  motion: "rise",         // "across" | "arc" | "rise"
  direction: "ltr",       // across/arc only; "rtl" flies right-to-left (image is mirrored)
  durationMs: 6000,       // one flight
  everyMs: 20000,         // pause between flights (±20% random)
  firstDelayMs: 3000,
  altitude: [40, 60],     // vh band (for "rise": how high it climbs)
  formation: 1,           // copies flying together (aircraft)
  trail: "none",          // "tricolor" | "sparkle" | "stardust" | "none"
  burst: { particles: 44, radius: 210, durationMs: 2100 }, // or true for defaults (36 / 170 / 1900), or omit
  opacity: 0.85,
}
```

Artifacts are behind the page content, can't be clicked, are hidden from screen
readers, skip hidden tabs, and are switched off entirely for visitors who prefer
reduced motion. Rockets launch from the side margins so they never cross the headline.

## Adding a new theme

1. Create `themes/<name>/` with `theme.json` (copy an existing one), `overlay.tsx`, `artifacts.ts` and `assets/`.
2. Import the `theme.json` in `registry.ts` and add the key to `supportedThemes` in `settings.json`.
3. Register the overlay in `themes/index.ts`.
