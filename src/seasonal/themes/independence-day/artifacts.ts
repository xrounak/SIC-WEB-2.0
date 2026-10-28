import plane from "./assets/plane.svg";
import type { ArtifactSpec } from "../shared/artifacts";

/** A three-jet formation trailing saffron, white and green smoke across the sky. */
export const artifacts: ArtifactSpec[] = [
  {
    id: "jet-formation",
    src: plane,
    width: 72,
    motion: "across",
    formation: 3,
    trail: "tricolor",
    durationMs: 9000,
    everyMs: 22000,
    firstDelayMs: 1800,
    altitude: [6, 13],
    opacity: 0.9,
  },
];
