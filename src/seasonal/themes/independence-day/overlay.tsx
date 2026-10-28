"use client";

import { useState, type CSSProperties } from "react";
import { BackLayer, Glow, HeroBand, TopBand } from "../shared/layers";
import { ArtifactLayer } from "../shared/artifacts";
import { artifacts } from "./artifacts";
import { CursorTrail } from "../shared/cursor-trail";
import { cursor } from "./cursor";

const CONFETTI_KEY = "sic-confetti-shown";

/**
 * Ashoka Chakra: 24 evenly spaced spokes in navy, drawn to proportion. Static,
 * shown small as a watermark, never rotated or stretched.
 */
function AshokaChakra({ style }: { style: CSSProperties }) {
  return (
    <svg className="chakra edge-only" style={style} viewBox="-50 -50 100 100" width="96" height="96">
      <g stroke="var(--color-navy)" fill="none">
        <circle r="46" strokeWidth="3.5" />
        <circle r="8" strokeWidth="2.5" />
        {Array.from({ length: 24 }, (_, i) => {
          const a = (i * Math.PI) / 12;
          return <line key={i} x1={8 * Math.cos(a)} y1={8 * Math.sin(a)} x2={44 * Math.cos(a)} y2={44 * Math.sin(a)} strokeWidth="1.4" />;
        })}
      </g>
      <circle r="3.5" fill="var(--color-navy)" />
    </svg>
  );
}

/** One short burst at the top of the hero, once per visit. Never loops. */
function Confetti() {
  const [show] = useState(() => {
    try {
      if (sessionStorage.getItem(CONFETTI_KEY)) return false;
      sessionStorage.setItem(CONFETTI_KEY, "1");
    } catch {}
    return true;
  });
  if (!show) return null;
  const colors = ["#FF9933", "#FFFFFF", "#138808"];
  return (
    <div className="confetti">
      {Array.from({ length: 18 }, (_, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={
            {
              left: `${8 + ((i * 47) % 84)}%`,
              background: colors[i % 3],
              "--drift": `${((i * 29) % 60) - 30}px`,
              "--spin": `${(i * 53) % 360}deg`,
              animationDelay: `${(i % 6) * 60}ms`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

export function IndependenceOverlay() {
  return (
    <>
      <BackLayer>
        <Glow color="rgba(255,153,51,0.08)" style={{ left: "-14vw", top: "-12vh", width: "44vw", height: "44vw" }} />
        <Glow color="rgba(19,136,8,0.08)" style={{ right: "-14vw", bottom: "-16vh", width: "44vw", height: "44vw" }} />
        <AshokaChakra style={{ right: 28, bottom: 24 }} />
      </BackLayer>
      <TopBand>
        <span className="tricolor" />
      </TopBand>
      <HeroBand>
        <Confetti />
      </HeroBand>
      <ArtifactLayer artifacts={artifacts} />
      <CursorTrail spec={cursor} />
    </>
  );
}
