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

const FLAG_SLICES = 9;

/**
 * Tricolour on a flagpole. The cloth is cut into vertical slices that rise and fall
 * one after another, so it ripples more toward the free end. Proportions 3:2.
 */
function WavingFlag({ style }: { style: CSSProperties }) {
  const w = 90 / FLAG_SLICES;
  return (
    <svg className="scene-piece edge-only" style={style} viewBox="0 0 110 160" width="110" height="160">
      <rect x="8" y="10" width="3" height="146" rx="1.5" fill="#C9A24A" />
      <circle cx="9.5" cy="9" r="3.5" fill="#E7C66A" />
      <rect x="2" y="152" width="15" height="6" rx="2" fill="#4A5563" />
      {Array.from({ length: FLAG_SLICES }, (_, i) => (
        <g
          key={i}
          className="flag-slice"
          style={{ "--amp": `${i * 0.7}px`, animationDelay: `${-(i * 0.16)}s` } as CSSProperties}
        >
          <rect x={11 + i * w} y="14" width={w + 0.6} height="20" fill="#FF9933" />
          <rect x={11 + i * w} y="34" width={w + 0.6} height="20" fill="#FFFFFF" />
          <rect x={11 + i * w} y="54" width={w + 0.6} height="20" fill="#138808" />
          {i === Math.floor(FLAG_SLICES / 2) && (
            <g transform={`translate(${11 + i * w + w / 2} 44)`} stroke="#000080" fill="none">
              <circle r="4.6" strokeWidth="0.9" />
              {Array.from({ length: 12 }, (_, k) => (
                <line key={k} x1="0" y1="0" x2={4.4 * Math.cos((k * Math.PI) / 6)} y2={4.4 * Math.sin((k * Math.PI) / 6)} strokeWidth="0.5" />
              ))}
            </g>
          )}
          <rect className="flag-shade" x={11 + i * w} y="14" width={w + 0.6} height="60" fill="#000" />
        </g>
      ))}
    </svg>
  );
}

/** A patang (kite) tugging on its string, tail ribbons fluttering. */
function Kite({ style }: { style: CSSProperties }) {
  return (
    <svg className="scene-piece edge-only" style={style} viewBox="0 0 130 170" width="130" height="170">
      <g className="kite-sway">
        <path d="M4 168 Q40 130 84 62" stroke="#B9C3CE" strokeWidth="0.8" fill="none" opacity="0.7" />
        <g transform="translate(88 40) rotate(12)">
          <path d="M0 -30 L22 0 L0 30 L-22 0 Z" fill="#FF9933" />
          <path d="M0 -30 L22 0 L0 0 Z" fill="#FFB866" />
          <path d="M0 0 L22 0 L0 30 Z" fill="#138808" />
          <path d="M0 0 L-22 0 L0 30 Z" fill="#1E9E12" />
          <path d="M0 -30 V30 M-22 0 H22" stroke="#7A4A1E" strokeWidth="1" />
          <g className="kite-tail">
            <path d="M0 30 Q-6 40 0 50 Q6 60 0 70" stroke="#FF9933" strokeWidth="1.4" fill="none" />
            <path d="M-4 44 L4 48 M-4 58 L4 62" stroke="#138808" strokeWidth="3" strokeLinecap="round" />
          </g>
        </g>
      </g>
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
        <WavingFlag style={{ left: "1.5rem", bottom: 0 }} />
        <Kite style={{ right: "9rem", bottom: 0 }} />
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
