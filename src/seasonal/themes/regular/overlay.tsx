import type { CSSProperties } from "react";
import { BackLayer, Glow } from "../shared/layers";
import { ArtifactLayer } from "../shared/artifacts";
import { artifacts } from "./artifacts";

/**
 * Industrial robot arm in line art: base, shoulder, elbow and a two-jaw gripper.
 * Each joint swings on its own CSS animation (seasonal.css, .robot-arm), so the arm
 * reaches down, grips, lifts and swings back on a loop.
 */
function RobotArm({ className, style }: { className?: string; style: CSSProperties }) {
  return (
    <svg className={`robot-arm edge-only ${className ?? ""}`} style={style} viewBox="0 0 220 220" width="220" height="220">
      <g fill="var(--color-surface-elevated, #1A2430)" stroke="var(--color-primary)" strokeWidth="2" strokeLinejoin="round">
        {/* Base */}
        <rect x="30" y="196" width="80" height="14" rx="3" />
        <path d="M45 196 L52 176 H88 L95 196 Z" />
        <g className="arm-shoulder">
          {/* Upper arm */}
          <rect x="60" y="88" width="20" height="92" rx="10" />
          <circle cx="70" cy="178" r="11" />
          <circle cx="70" cy="178" r="4" fill="var(--color-accent)" stroke="none" />
          <g className="arm-elbow">
            {/* Forearm */}
            <rect x="66" y="82" width="92" height="16" rx="8" />
            <circle cx="70" cy="90" r="10" />
            <circle cx="70" cy="90" r="3.5" fill="var(--color-accent)" stroke="none" />
            <g className="arm-wrist">
              <circle cx="158" cy="90" r="7" />
              <rect x="154" y="96" width="8" height="12" rx="2" />
              {/* Gripper jaws */}
              <path className="arm-jaw-l" d="M151 108 H158 V124 L153 128 Z" />
              <path className="arm-jaw-r" d="M158 108 H165 L163 128 L158 124 Z" />
              <circle className="arm-led" cx="158" cy="90" r="2.5" fill="var(--color-accent)" stroke="none" />
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
}

/** Quadcopter hovering low: rotors blur, status LED blinks, a scan beam pulses below. */
function Drone({ style }: { style: CSSProperties }) {
  return (
    <svg className="scene-piece edge-only" style={style} viewBox="0 0 140 110" width="140" height="110">
      <path className="drone-beam" d="M62 46 L40 106 H100 L78 46 Z" fill="url(#drone-beam)" />
      <defs>
        <linearGradient id="drone-beam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#63D6B0" stopOpacity="0.45" />
          <stop offset="1" stopColor="#63D6B0" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g className="drone-hover" fill="var(--color-surface-elevated, #1A2430)" stroke="var(--color-primary)" strokeWidth="1.8" strokeLinejoin="round">
        <path d="M30 26 L58 34 M110 26 L82 34" strokeLinecap="round" />
        <rect x="56" y="28" width="28" height="18" rx="6" />
        <circle cx="70" cy="37" r="4" fill="#0B0F14" />
        <circle className="drone-led" cx="70" cy="37" r="2" fill="var(--color-accent)" stroke="none" />
        <path d="M60 46 L56 54 M80 46 L84 54" strokeLinecap="round" />
        {[30, 110].map((x) => (
          <g key={x}>
            <rect x={x - 3} y="20" width="6" height="8" rx="2" />
            <ellipse className="drone-rotor" cx={x} cy="19" rx="20" ry="2.4" fill="rgb(120 169 255 / 0.25)" />
          </g>
        ))}
      </g>
    </svg>
  );
}

function gearPath(r: number, teeth: number, depth: number) {
  const step = (Math.PI * 2) / teeth;
  const pt = (radius: number, a: number) => `${(radius * Math.cos(a)).toFixed(2)} ${(radius * Math.sin(a)).toFixed(2)}`;
  const parts = Array.from({ length: teeth }, (_, i) => {
    const a = i * step;
    return `${pt(r - depth, a)} L${pt(r, a + step * 0.15)} L${pt(r, a + step * 0.45)} L${pt(r - depth, a + step * 0.6)}`;
  });
  return `M${parts.join(" L")} Z`;
}

/** Two meshed gears turning against each other. */
function Gears({ style }: { style: CSSProperties }) {
  return (
    <svg className="scene-piece edge-only" style={style} viewBox="0 0 140 110" width="140" height="110">
      <g fill="var(--color-surface-elevated, #1A2430)" stroke="var(--color-primary)" strokeWidth="1.8" strokeLinejoin="round">
        <g transform="translate(50 64)">
          <g className="gear-big">
            {/* Invisible bounding circle keeps the rotation centred on the hub. */}
            <circle r="38" fill="none" stroke="none" />
            <path d={gearPath(38, 12, 7)} />
            <circle r="10" />
            <circle r="3.5" fill="var(--color-accent)" stroke="none" />
          </g>
        </g>
        <g transform="translate(108 46)">
          <g className="gear-small">
            <circle r="26" fill="none" stroke="none" />
            <path d={gearPath(26, 8, 7)} />
            <circle r="7" />
            <circle r="2.5" fill="var(--color-accent)" stroke="none" />
          </g>
        </g>
      </g>
    </svg>
  );
}

/** Regular mode: calm blue glow, two robot arms at work in the corners, a car driving by. */
export function RegularOverlay() {
  return (
    <>
      <BackLayer>
        <Glow color="rgba(120,169,255,0.07)" style={{ left: "-16vw", top: "-14vh", width: "46vw", height: "46vw" }} />
        <Glow color="rgba(99,214,176,0.06)" style={{ right: "-16vw", bottom: "-18vh", width: "46vw", height: "46vw" }} />
        <RobotArm style={{ left: "1.5rem", bottom: "0.5rem" }} />
        <RobotArm className="is-mirrored" style={{ right: "1.5rem", bottom: "0.5rem" }} />
        <Drone style={{ left: "13rem", bottom: "1rem" }} />
        <Gears style={{ right: "13rem", bottom: "0.5rem" }} />
      </BackLayer>
      <ArtifactLayer artifacts={artifacts} />
    </>
  );
}
