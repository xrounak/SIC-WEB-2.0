import type { CSSProperties } from "react";
import { BackLayer, Glow, StringLights, TopBand } from "../shared/layers";
import { ArtifactLayer } from "../shared/artifacts";
import { artifacts } from "./artifacts";
import { CursorTrail } from "../shared/cursor-trail";
import { cursor } from "./cursor";

/** Six-armed vector snowflake. */
function Flake({ size }: { size: number }) {
  return (
    <svg viewBox="-12 -12 24 24" width={size} height={size}>
      <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none">
        {[0, 60, 120].map((deg) => (
          <g key={deg} transform={`rotate(${deg})`}>
            <path d="M0 -10 V10" />
            <path d="M-3 -7 L0 -4 L3 -7 M-3 7 L0 4 L3 7" />
          </g>
        ))}
      </g>
    </svg>
  );
}

function CandyCane({ style }: { style: CSSProperties }) {
  return (
    <svg className="candy-cane edge-only" style={style} viewBox="0 0 40 80" width="30" height="60">
      <defs>
        <clipPath id="cane-shape">
          <path d="M14 78 V24 a12 12 0 0 1 24 0 v4 h-7 v-4 a5 5 0 0 0 -10 0 V78 Z" />
        </clipPath>
      </defs>
      <g clipPath="url(#cane-shape)">
        <rect width="40" height="80" fill="#F5F7F2" />
        {Array.from({ length: 12 }, (_, i) => (
          <rect key={i} x="-20" y={i * 8 - 10} width="80" height="3.5" fill="#D94F5C" transform="rotate(-35 20 40)" />
        ))}
      </g>
    </svg>
  );
}

function EvergreenSprig({ style }: { style: CSSProperties }) {
  return (
    <svg className="sprig edge-only" style={style} viewBox="0 0 90 60" width="84" height="56">
      <path d="M6 54 C30 40 56 26 84 8" stroke="#3E7A5F" strokeWidth="2" fill="none" strokeLinecap="round" />
      {Array.from({ length: 9 }, (_, i) => {
        const t = (i + 1) / 10;
        const x = 6 + 78 * t;
        const y = 54 - 46 * t;
        return (
          <g key={i} stroke="#5BC49A" strokeWidth="1.5" strokeLinecap="round" opacity={0.85}>
            <path d={`M${x} ${y} l-7 -6`} />
            <path d={`M${x} ${y} l7 5`} />
          </g>
        );
      })}
      <circle cx="30" cy="42" r="3.2" fill="#D94F5C" />
      <circle cx="35" cy="45" r="3.2" fill="#D94F5C" />
      <circle cx="33" cy="39" r="3.2" fill="#E7C66A" />
    </svg>
  );
}

export function ChristmasOverlay() {
  // Sparse flakes along both page edges; never in the reading column.
  const flakes = Array.from({ length: 14 }, (_, i) => {
    const leftSide = i % 2 === 0;
    const offset = (i * 37) % 9;
    return {
      side: leftSide ? { left: `${1 + offset}%` } : { right: `${1 + offset}%` },
      size: 8 + ((i * 5) % 9),
      opacity: 0.25 + ((i * 7) % 5) / 12,
      delay: -((i * 2.6) % 18),
      durationScale: 0.8 + ((i * 3) % 5) / 10,
    };
  });

  return (
    <>
      <BackLayer>
        <Glow color="var(--color-ambient-glow)" style={{ right: "-10vw", top: "-14vh", width: "44vw", height: "44vw" }} />
        <Glow color="rgba(231,198,106,0.06)" style={{ left: "-12vw", bottom: "-18vh", width: "40vw", height: "40vw" }} />
        {flakes.map((f, i) => (
          <span
            key={i}
            className="snowflake"
            style={
              {
                ...f.side,
                opacity: f.opacity,
                animationDelay: `${f.delay}s`,
                "--fall-scale": f.durationScale,
              } as unknown as CSSProperties
            }
          >
            <Flake size={f.size} />
          </span>
        ))}
        <CandyCane style={{ left: 26, bottom: 18 }} />
        <EvergreenSprig style={{ right: 20, bottom: 16 }} />
      </BackLayer>
      <TopBand>
        <StringLights colors={["#FFF4E0", "#D94F5C", "#E7C66A", "#FFF4E0", "#82DDB8"]} spans={3} bulbsPerSpan={4} sag={18} />
      </TopBand>
      <ArtifactLayer artifacts={artifacts} />
      <CursorTrail spec={cursor} />
    </>
  );
}
