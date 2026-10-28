import sleigh from "./assets/reindeer-sleigh.svg";
import type { ArtifactSpec } from "../shared/artifacts";

/** Reindeer and sleigh arcing across the top of the sky, leaving a trail of stardust. */
export const artifacts: ArtifactSpec[] = [
  {
    id: "reindeer-sleigh",
    src: sleigh,
    width: 170,
    motion: "arc",
    direction: "ltr",
    trail: "stardust",
    durationMs: 14000,
    everyMs: 26000,
    firstDelayMs: 2500,
    altitude: [4, 12],
    opacity: 0.85,
  },
];
