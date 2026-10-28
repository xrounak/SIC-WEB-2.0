import rocket from "./assets/rocket.svg";
import type { ArtifactSpec } from "../shared/artifacts";

/**
 * Sky rockets that climb with a sparkling tail and burst near the top.
 * Tune each burst with `particles` (sparks, split over two rings), `radius` (px)
 * and `durationMs`.
 */
export const artifacts: ArtifactSpec[] = [
  {
    id: "rocket-a",
    src: rocket,
    width: 16,
    motion: "rise",
    trail: "sparkle",
    burst: { particles: 44, radius: 210, durationMs: 2100 },
    durationMs: 2200,
    everyMs: 5500,
    firstDelayMs: 1500,
    altitude: [55, 75],
  },
  {
    id: "rocket-b",
    src: rocket,
    width: 13,
    motion: "rise",
    trail: "sparkle",
    burst: { particles: 36, radius: 170 },
    durationMs: 2500,
    everyMs: 7000,
    firstDelayMs: 4200,
    altitude: [45, 65],
  },
  {
    id: "rocket-c",
    src: rocket,
    width: 14,
    motion: "rise",
    trail: "sparkle",
    burst: { particles: 52, radius: 240, durationMs: 2300 },
    durationMs: 2000,
    everyMs: 9000,
    firstDelayMs: 7000,
    altitude: [60, 78],
  },
];
