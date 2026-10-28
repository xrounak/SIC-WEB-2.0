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

/** Regular mode: calm blue glow, two robot arms at work in the corners, a car driving by. */
export function RegularOverlay() {
  return (
    <>
      <BackLayer>
        <Glow color="rgba(120,169,255,0.07)" style={{ left: "-16vw", top: "-14vh", width: "46vw", height: "46vw" }} />
        <Glow color="rgba(99,214,176,0.06)" style={{ right: "-16vw", bottom: "-18vh", width: "46vw", height: "46vw" }} />
        <RobotArm style={{ left: "1.5rem", bottom: "0.5rem" }} />
        <RobotArm className="is-mirrored" style={{ right: "1.5rem", bottom: "0.5rem" }} />
      </BackLayer>
      <ArtifactLayer artifacts={artifacts} />
    </>
  );
}
