import type { CSSProperties, ReactNode } from "react";

/**
 * Shared pieces for theme decorations. Containers are aria-hidden and use
 * pointer-events: none; everything draws with CSS/SVG.
 */

/** Fixed full-viewport layer behind content: glows, corner ornaments, snow. */
export function BackLayer({ children }: { children: ReactNode }) {
  return (
    <div className="season-layer" aria-hidden="true">
      {children}
    </div>
  );
}

/** Band that scrolls with the page, starting under the 64px header: lights, ribbon. */
export function TopBand({ children }: { children: ReactNode }) {
  return (
    <div className="season-top" aria-hidden="true">
      {children}
    </div>
  );
}

/** Region around the hero (first ~560px under the header), scrolls with the page. */
export function HeroBand({ children }: { children: ReactNode }) {
  return (
    <div className="season-hero" aria-hidden="true">
      {children}
    </div>
  );
}

/** A drooping wire of bulbs. Twinkle speed comes from the theme's --motion-light-twinkle. */
export function StringLights({
  colors,
  spans = 4,
  bulbsPerSpan = 5,
  sag = 22,
}: {
  colors: string[];
  spans?: number;
  bulbsPerSpan?: number;
  sag?: number;
}) {
  const top = 4;
  const width = 100 / spans;
  const path = Array.from({ length: spans }, (_, i) => {
    const x0 = (i * 1000) / spans;
    const x1 = ((i + 1) * 1000) / spans;
    return `${i === 0 ? `M${x0} ${top}` : ""} Q${(x0 + x1) / 2} ${top + sag * 2} ${x1} ${top}`;
  }).join(" ");

  const bulbs: Array<{ left: number; top: number; color: string; delay: number }> = [];
  for (let i = 0; i < spans; i++) {
    for (let k = 1; k <= bulbsPerSpan; k++) {
      const t = k / (bulbsPerSpan + 1);
      bulbs.push({
        left: i * width + t * width,
        top: top + sag * 2 * 2 * t * (1 - t),
        color: colors[bulbs.length % colors.length],
        delay: (bulbs.length * 0.41) % 3.2,
      });
    }
  }

  return (
    <div className="season-lights">
      <svg className="season-lights-wire" viewBox={`0 0 1000 ${top + sag * 2}`} preserveAspectRatio="none">
        <path d={path} fill="none" stroke="currentColor" strokeWidth="1.25" vectorEffect="non-scaling-stroke" />
      </svg>
      {bulbs.map((b, i) => (
        <span
          key={i}
          className="season-bulb"
          style={{ left: `${b.left}%`, top: `${b.top}px`, "--bulb": b.color, animationDelay: `${-b.delay}s` } as CSSProperties}
        />
      ))}
    </div>
  );
}

/** Soft radial light. */
export function Glow({ color, style, className }: { color: string; style: CSSProperties; className?: string }) {
  return (
    <span
      className={`season-glow ${className ?? ""}`}
      style={{ background: `radial-gradient(closest-side, ${color}, transparent)`, ...style }}
    />
  );
}
