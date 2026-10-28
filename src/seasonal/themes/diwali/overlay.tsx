import type { CSSProperties } from "react";
import { BackLayer, Glow, HeroBand, StringLights, TopBand } from "../shared/layers";
import { ArtifactLayer } from "../shared/artifacts";
import { artifacts } from "./artifacts";
import { CursorTrail } from "../shared/cursor-trail";
import { cursor } from "./cursor";

/** Small clay diya with a flickering flame (--motion-flame-flicker). */
function Diya({ id, style, size = 48 }: { id: string; style: CSSProperties; size?: number }) {
  return (
    <svg className="diya edge-only" style={{ width: size, height: (size * 48) / 64, ...style }} viewBox="0 0 64 48">
      <defs>
        <radialGradient id={`${id}-halo`}>
          <stop offset="0" stopColor="#FFD166" stopOpacity="0.5" />
          <stop offset="1" stopColor="#F5B942" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-flame`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFF6D8" />
          <stop offset="0.45" stopColor="#FFD166" />
          <stop offset="1" stopColor="#FF7A32" />
        </linearGradient>
        <linearGradient id={`${id}-clay`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#B45A2E" />
          <stop offset="1" stopColor="#5E2410" />
        </linearGradient>
      </defs>
      <circle className="diya-halo" cx="32" cy="16" r="18" fill={`url(#${id}-halo)`} />
      <g className="diya-flame">
        <path d="M32 3 C36.5 10 38 15.5 32 22 C26 15.5 27.5 10 32 3 Z" fill={`url(#${id}-flame)`} />
        <path d="M32 11 C33.8 14.5 34 17.5 32 20.5 C30 17.5 30.2 14.5 32 11 Z" fill="#FFFBE9" opacity="0.8" />
      </g>
      <path d="M8 25 Q32 31 56 25 Q52 42 32 44 Q12 42 8 25 Z" fill={`url(#${id}-clay)`} />
      <ellipse cx="32" cy="25.5" rx="24" ry="4.2" fill="#C8693A" />
      <ellipse cx="32" cy="25.5" rx="18" ry="2.6" fill="#3A1406" opacity="0.6" />
      <g fill="#F5B942" opacity="0.75">
        <circle cx="21" cy="34" r="1.2" />
        <circle cx="32" cy="37.2" r="1.2" />
        <circle cx="43" cy="34" r="1.2" />
      </g>
    </svg>
  );
}

/** Minimal paper-lantern silhouette that drifts slowly (--motion-lantern-drift). */
function Lantern({ id, style }: { id: string; style: CSSProperties }) {
  return (
    <span className="lantern edge-only" style={style}>
      <svg viewBox="0 0 40 62" width="30" height="47">
        <defs>
          <linearGradient id={`${id}-paper`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFD166" />
            <stop offset="0.65" stopColor="#F5B942" />
            <stop offset="1" stopColor="#FF7A32" />
          </linearGradient>
          <radialGradient id={`${id}-core`} cx="0.5" cy="0.78" r="0.6">
            <stop offset="0" stopColor="#FFF4C2" stopOpacity="0.9" />
            <stop offset="1" stopColor="#FFF4C2" stopOpacity="0" />
          </radialGradient>
        </defs>
        <path d="M20 0 V6" stroke="#B9BECA" strokeOpacity="0.4" strokeWidth="0.8" />
        <path d="M9 8 Q20 3 31 8 L35 45 Q20 52 5 45 Z" fill={`url(#${id}-paper)`} opacity="0.92" />
        <path d="M9 8 Q20 3 31 8 L35 45 Q20 52 5 45 Z" fill={`url(#${id}-core)`} />
        <path d="M14.5 7 L12 48 M20 5.5 L20 50 M25.5 7 L28 48" stroke="#9A3F10" strokeOpacity="0.28" strokeWidth="0.8" />
        <ellipse cx="20" cy="48" rx="8.5" ry="2.2" fill="#5E2410" opacity="0.55" />
      </svg>
    </span>
  );
}

const RANGOLI_OUTER = ["#FF7A32", "#D94F5C", "#FFD166"];
const RANGOLI_INNER = ["#9B5DE5", "#5BC49A"];

/** Rangoli on the floor: petals in rings, the rings turning slowly in opposite directions. */
function Rangoli({ style }: { style: CSSProperties }) {
  return (
    <span className="rangoli edge-only" style={style}>
      <svg viewBox="-60 -60 120 120" width="100%" height="100%">
        <g className="rangoli-outer">
          <circle r="56" fill="none" stroke="#F5B942" strokeWidth="1.2" strokeDasharray="3 4" />
          {Array.from({ length: 12 }, (_, i) => (
            <ellipse key={i} cx="0" cy="-36" rx="7" ry="17" transform={`rotate(${i * 30})`} fill={RANGOLI_OUTER[i % 3]} opacity="0.85" />
          ))}
          {Array.from({ length: 12 }, (_, i) => (
            <circle key={i} className="rangoli-dot" cx="0" cy="-51" r="2" transform={`rotate(${i * 30 + 15})`} fill="#FFF1CC" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </g>
        <g className="rangoli-inner">
          {Array.from({ length: 8 }, (_, i) => (
            <ellipse key={i} cx="0" cy="-17" rx="5.5" ry="11" transform={`rotate(${i * 45})`} fill={RANGOLI_INNER[i % 2]} opacity="0.9" />
          ))}
        </g>
        <circle r="8" fill="#FFD166" />
        <circle r="3.5" fill="#D94F5C" />
      </svg>
    </span>
  );
}

/** Anar (flower pot firework): a clay cone with a fountain of sparks. */
function Anar({ style }: { style: CSSProperties }) {
  return (
    <svg className="anar edge-only" style={style} viewBox="0 0 80 130" width="80" height="130">
      <defs>
        <radialGradient id="anar-glow">
          <stop offset="0" stopColor="#FFF4C2" stopOpacity="0.9" />
          <stop offset="1" stopColor="#FF7A32" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="anar-cone" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#7A2E12" />
          <stop offset="0.5" stopColor="#C8693A" />
          <stop offset="1" stopColor="#7A2E12" />
        </linearGradient>
      </defs>
      <circle className="anar-glow" cx="40" cy="98" r="22" fill="url(#anar-glow)" />
      {Array.from({ length: 26 }, (_, i) => (
        <circle
          key={i}
          className="anar-spark"
          cx="40"
          cy="98"
          r={1 + (i % 3) * 0.5}
          fill={["#FFF4C2", "#FFD166", "#FF7A32"][i % 3]}
          style={
            {
              "--dx": `${((i * 17) % 52) - 26}px`,
              "--dy": `${-62 - ((i * 11) % 36)}px`,
              animationDelay: `${-(i * 0.043)}s`,
            } as CSSProperties
          }
        />
      ))}
      <path d="M31 98 H49 L56 124 H24 Z" fill="url(#anar-cone)" />
      <path d="M27 110 H53 M25 117 H55" stroke="#F5B942" strokeWidth="1" opacity="0.7" />
      <ellipse cx="40" cy="98" rx="9" ry="2" fill="#3A1406" />
    </svg>
  );
}

export function DiwaliOverlay() {
  return (
    <>
      <BackLayer>
        <Glow color="rgba(255,174,66,0.10)" style={{ left: "-14vw", bottom: "-22vh", width: "46vw", height: "46vw" }} />
        <Glow color="rgba(255,122,50,0.07)" style={{ right: "-14vw", bottom: "-24vh", width: "42vw", height: "42vw" }} />
        <Diya id="diya-a" style={{ left: 24, bottom: 18 }} />
        <Diya id="diya-b" style={{ left: 70, bottom: 14 }} size={36} />
        <Diya id="diya-c" style={{ right: 28, bottom: 18 }} />
        <Rangoli style={{ left: "8rem", bottom: "-2.5rem" }} />
        <Anar style={{ right: "6.5rem", bottom: 0 }} />
      </BackLayer>

      <TopBand>
        <StringLights colors={["#FFD166", "#F5B942", "#FFF1CC", "#FF7A32"]} spans={4} bulbsPerSpan={5} />
      </TopBand>

      <HeroBand>
        <Glow
          color="var(--color-ambient-glow)"
          className="season-breathe"
          style={{ right: "4%", top: 20, width: "min(46vw, 620px)", height: 460 }}
        />
        <Lantern id="lantern-a" style={{ left: 28, top: 120 }} />
        <Lantern id="lantern-b" style={{ right: 34, top: 90, animationDelay: "-5s" }} />
        <Lantern id="lantern-c" style={{ right: 78, top: 250, animationDelay: "-9s", scale: "0.8" }} />
      </HeroBand>
      <ArtifactLayer artifacts={artifacts} />
      <CursorTrail spec={cursor} />
    </>
  );
}
