"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { StaticImageData } from "next/image";

/**
 * Artifacts: SVG objects that fly across the screen now and then, behind the
 * content. Each theme lists its own in ./themes/<theme>/artifacts.ts.
 *
 * Motions
 *   across  straight flight across the sky (plane)
 *   arc     curved path across the top (sleigh)
 *   rise    launches from the bottom and bursts (rocket)
 * Trails
 *   tricolor  saffron / white / green smoke, one colour per aircraft in a formation
 *   sparkle   glowing streak with twinkling sparks
 *   stardust  fine glitter behind the object
 */
export type ArtifactSpec = {
  id: string;
  /** SVG imported from the theme's assets folder. Draw it facing right (or up, for "rise"). */
  src: StaticImageData;
  /** Rendered width in px; height follows the SVG's aspect ratio. */
  width: number;
  motion: "across" | "arc" | "rise";
  /** Flight direction for across/arc. Default left-to-right. */
  direction?: "ltr" | "rtl";
  durationMs: number;
  /** Pause between flights; a little randomness is added. */
  everyMs: number;
  firstDelayMs?: number;
  /** Vertical band (vh from the top) the flight can use. For "rise": how high it climbs. */
  altitude?: [number, number];
  /** Copies flying in formation (aircraft). */
  formation?: number;
  trail?: "tricolor" | "sparkle" | "stardust" | "none";
  /**
   * Firework burst at the top of a "rise". `true` uses the defaults; or tune it:
   * particles per burst (two rings), radius in px, and burst length in ms.
   */
  burst?: boolean | BurstSpec;
  opacity?: number;
};

export type BurstSpec = { particles?: number; radius?: number; durationMs?: number };

const BURST_DEFAULTS: Required<BurstSpec> = { particles: 36, radius: 170, durationMs: 1900 };

function burstOf(spec: ArtifactSpec): Required<BurstSpec> | null {
  if (!spec.burst) return null;
  return spec.burst === true ? BURST_DEFAULTS : { ...BURST_DEFAULTS, ...spec.burst };
}

type Flight = { key: number; spec: ArtifactSpec; y: number; x: number };

const TRICOLOR = ["#FF9933", "#FFFFFF", "#138808"];

function between([a, b]: [number, number]) {
  return a + Math.random() * (b - a);
}

export function ArtifactLayer({ artifacts }: { artifacts: ArtifactSpec[] }) {
  const [flights, setFlights] = useState<Flight[]>([]);
  const counter = useRef(0);

  useEffect(() => {
    if (artifacts.length === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timers: number[] = [];
    const launch = (spec: ArtifactSpec) => {
      if (!document.hidden) {
        const key = ++counter.current;
        const flight: Flight = {
          key,
          spec,
          y: between(spec.altitude ?? (spec.motion === "rise" ? [45, 70] : [10, 30])),
          // Rockets launch from the side margins so they never cross the headline.
          x: Math.random() < 0.5 ? between([3, 18]) : between([82, 97]),
        };
        setFlights((f) => [...f, flight]);
        const life = spec.durationMs + (burstOf(spec)?.durationMs ?? 0) + 300;
        timers.push(window.setTimeout(() => setFlights((f) => f.filter((x) => x.key !== key)), life));
      }
      timers.push(window.setTimeout(() => launch(spec), spec.durationMs + spec.everyMs * (0.8 + Math.random() * 0.4)));
    };
    artifacts.forEach((spec) => timers.push(window.setTimeout(() => launch(spec), spec.firstDelayMs ?? 2500)));
    return () => timers.forEach(clearTimeout);
  }, [artifacts]);

  return (
    <div className="season-layer artifact-layer" aria-hidden="true">
      {flights.map((f) => (
        <FlightView key={f.key} flight={f} />
      ))}
    </div>
  );
}

function FlightView({ flight }: { flight: Flight }) {
  const { spec, y, x } = flight;
  const rtl = spec.direction === "rtl";
  const style = {
    "--dur": `${spec.durationMs}ms`,
    "--alt": `${y}vh`,
    opacity: spec.opacity ?? 0.85,
  } as CSSProperties;

  if (spec.motion === "rise") {
    return (
      <>
        <span className="artifact artifact-rise" style={{ ...style, left: `${x}%` }}>
          {spec.trail === "sparkle" && <SparkleTrail vertical />}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={spec.src.src} alt="" width={spec.width} draggable={false} />
        </span>
        {burstOf(spec) && <Burst x={x} y={y} delayMs={spec.durationMs} burst={burstOf(spec)!} />}
      </>
    );
  }

  const copies = Array.from({ length: spec.formation ?? 1 }, (_, i) => i);
  return (
    <span
      className={`artifact artifact-${spec.motion} ${rtl ? "is-rtl" : ""}`}
      style={{ ...style, top: `${y}vh` }}
    >
      <span className="artifact-bob">
        {copies.map((i) => (
          <span
            key={i}
            className="artifact-craft"
            style={{ transform: `translate(${-i * spec.width * 0.55}px, ${(i - (copies.length - 1) / 2) * spec.width * 0.32}px)` }}
          >
            {spec.trail === "tricolor" && (
              <span className="trail-smoke" style={{ "--smoke": TRICOLOR[i % 3] } as CSSProperties} />
            )}
            {spec.trail === "stardust" && <span className="trail-stardust" />}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={spec.src.src} alt="" width={spec.width} draggable={false} style={rtl ? { transform: "scaleX(-1)" } : undefined} />
          </span>
        ))}
      </span>
    </span>
  );
}

function SparkleTrail({ vertical }: { vertical?: boolean }) {
  return (
    <span className={vertical ? "trail-sparkle is-vertical" : "trail-sparkle"}>
      {Array.from({ length: 6 }, (_, i) => (
        <i key={i} style={{ animationDelay: `${i * 90}ms`, left: `${(i % 3) * 4 - 4}px`, top: `${8 + i * 9}px` }} />
      ))}
    </span>
  );
}

const BURST_COLORS = ["var(--color-primary)", "var(--color-primary-hover)", "var(--color-accent)", "#FFF4D6", "var(--color-accent-secondary, #9B5DE5)"];

/**
 * Two rings of glowing streaks with a bright core flash. Each spark flies out,
 * droops a little under "gravity", then crackles and fades. Variation comes from
 * the particle index, so every burst looks organic without per-render randomness.
 */
function Burst({ x, y, delayMs, burst }: { x: number; y: number; delayMs: number; burst: Required<BurstSpec> }) {
  const outer = Math.round(burst.particles * 0.62);
  const inner = burst.particles - outer;
  const sparks = [
    ...Array.from({ length: outer }, (_, i) => ({ ring: 1, i, n: outer })),
    ...Array.from({ length: inner }, (_, i) => ({ ring: 0.55, i, n: inner })),
  ];
  return (
    <span
      className="artifact-burst"
      style={{ left: `${x}%`, bottom: `calc(${y}vh + 2vh)`, "--burst-dur": `${burst.durationMs}ms` } as CSSProperties}
    >
      <b className="burst-flash" style={{ animationDelay: `${delayMs}ms`, "--flash": `${burst.radius * 0.9}px` } as CSSProperties} />
      {sparks.map(({ ring, i, n }, k) => {
        const jitter = ((k * 37) % 11) / 10; // 0..1, stable per spark
        const offset = ring < 1 ? 180 / n : 0;
        return (
          <i
            key={k}
            style={
              {
                "--angle": `${(360 / n) * i + offset + jitter * 6}deg`,
                "--dist": `${burst.radius * ring * (0.82 + jitter * 0.3)}px`,
                "--spark": BURST_COLORS[k % BURST_COLORS.length],
                animationDelay: `${delayMs + (ring < 1 ? 70 : 0)}ms`,
              } as CSSProperties
            }
          />
        );
      })}
    </span>
  );
}
