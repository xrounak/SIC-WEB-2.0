import car from "./assets/car.svg";
import type { ArtifactSpec } from "../shared/artifacts";

/** An electric car cruising along the bottom of the screen now and then. */
export const artifacts: ArtifactSpec[] = [
  {
    id: "car",
    src: car,
    width: 200,
    motion: "across",
    direction: "ltr",
    trail: "none",
    durationMs: 9000,
    everyMs: 22000,
    firstDelayMs: 2000,
    altitude: [84, 86],
    opacity: 0.8,
  },
];
