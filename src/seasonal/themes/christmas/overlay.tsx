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

/** Snowman on a snow mound, waving one stick arm, scarf tail swaying. */
function Snowman({ style }: { style: CSSProperties }) {
  return (
    <svg className="scene-piece edge-only" style={style} viewBox="0 0 100 130" width="100" height="130">
      <ellipse cx="50" cy="124" rx="46" ry="7" fill="#F5F7F2" opacity="0.85" />
      <circle cx="50" cy="100" r="24" fill="#F5F7F2" />
      <circle cx="50" cy="66" r="17" fill="#F5F7F2" />
      <circle cx="50" cy="38" r="12" fill="#F5F7F2" />
      <path d="M26 104 A24 24 0 0 0 74 104" fill="#C9D6E3" opacity="0.5" />
      {/* Hat */}
      <rect x="37" y="25" width="26" height="3" rx="1" fill="#1B2A22" />
      <rect x="41" y="10" width="18" height="16" rx="2" fill="#1B2A22" />
      <rect x="41" y="21" width="18" height="3" fill="#D94F5C" />
      {/* Face */}
      <circle cx="45.5" cy="36" r="1.6" fill="#1B2A22" />
      <circle cx="54.5" cy="36" r="1.6" fill="#1B2A22" />
      <path d="M50 39 L60 41 L50 42 Z" fill="#F08A3C" />
      <path d="M45 44 Q50 47 55 44" stroke="#1B2A22" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      {/* Buttons */}
      <circle cx="50" cy="62" r="1.8" fill="#1B2A22" />
      <circle cx="50" cy="70" r="1.8" fill="#1B2A22" />
      {/* Scarf */}
      <path d="M37 49 Q50 55 63 49 L63 53 Q50 59 37 53 Z" fill="#D94F5C" />
      <path className="snowman-scarf" d="M56 53 L60 70 L54 70 L52 54 Z" fill="#B83A47" />
      {/* Arms */}
      <path d="M34 64 L14 52 M20 55 L16 47" stroke="#6B4A2E" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <g className="snowman-wave">
        <path d="M66 64 L86 46 M80 51 L86 54" stroke="#6B4A2E" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      </g>
    </svg>
  );
}

const TREE_LIGHTS: Array<[number, number, string]> = [
  [44, 46, "#D94F5C"], [58, 50, "#E7C66A"], [38, 66, "#82DDB8"], [52, 70, "#FFF4E0"], [64, 74, "#D94F5C"],
  [32, 90, "#E7C66A"], [46, 94, "#D94F5C"], [60, 96, "#82DDB8"], [72, 100, "#E7C66A"], [40, 106, "#FFF4E0"],
];

/** Christmas tree with twinkling lights, a gold garland and a glowing star. */
function Tree({ style }: { style: CSSProperties }) {
  return (
    <svg className="scene-piece edge-only" style={style} viewBox="0 0 100 140" width="100" height="140">
      <ellipse cx="50" cy="134" rx="44" ry="6" fill="#F5F7F2" opacity="0.85" />
      <rect x="45" y="114" width="10" height="16" fill="#6B4A2E" />
      <path d="M50 22 L74 60 H26 Z" fill="#2F6B4F" />
      <path d="M50 40 L82 86 H18 Z" fill="#2B5E46" />
      <path d="M50 62 L90 116 H10 Z" fill="#265440" />
      <path d="M30 58 Q50 66 70 56 M24 84 Q50 94 78 82 M18 112 Q50 122 86 110" stroke="#E7C66A" strokeWidth="1.3" fill="none" opacity="0.8" />
      {TREE_LIGHTS.map(([x, y, c], i) => (
        <circle key={i} className="tree-light" cx={x} cy={y} r="2.6" fill={c} style={{ animationDelay: `${-(i * 0.37)}s` }} />
      ))}
      <path
        className="tree-star"
        d="M50 6 L53.5 15 L63 15.5 L55.5 21.5 L58 31 L50 25.5 L42 31 L44.5 21.5 L37 15.5 L46.5 15 Z"
        fill="#F5D46A"
      />
    </svg>
  );
}

/** Two wrapped presents; the small one gives a little hop now and then. */
function Gifts({ style }: { style: CSSProperties }) {
  return (
    <svg className="scene-piece edge-only" style={style} viewBox="0 0 90 60" width="90" height="60">
      <rect x="4" y="22" width="42" height="34" rx="2" fill="#B83A47" />
      <rect x="22" y="22" width="6" height="34" fill="#E7C66A" />
      <rect x="2" y="16" width="46" height="8" rx="2" fill="#D94F5C" />
      <rect x="22" y="16" width="6" height="8" fill="#E7C66A" />
      <path d="M25 16 C17 6 10 12 18 16 M25 16 C33 6 40 12 32 16" stroke="#E7C66A" strokeWidth="2.4" fill="none" />
      <g className="gift-hop">
        <rect x="52" y="32" width="32" height="24" rx="2" fill="#2F6B4F" />
        <rect x="65" y="32" width="6" height="24" fill="#F5F7F2" />
        <rect x="50" y="27" width="36" height="7" rx="2" fill="#3E7A5F" />
        <rect x="65" y="27" width="6" height="7" fill="#F5F7F2" />
        <path d="M68 27 C62 19 56 24 63 27 M68 27 C74 19 80 24 73 27" stroke="#F5F7F2" strokeWidth="2" fill="none" />
      </g>
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
        <Snowman style={{ left: "4.5rem", bottom: 0 }} />
        <Tree style={{ right: "7rem", bottom: 0 }} />
        <Gifts style={{ right: "13.5rem", bottom: "0.25rem" }} />
      </BackLayer>
      <TopBand>
        <StringLights colors={["#FFF4E0", "#D94F5C", "#E7C66A", "#FFF4E0", "#82DDB8"]} spans={3} bulbsPerSpan={4} sag={18} />
      </TopBand>
      <ArtifactLayer artifacts={artifacts} />
      <CursorTrail spec={cursor} />
    </>
  );
}
