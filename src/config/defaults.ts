import type { Settings } from "@/types/simulation";

export const DEFAULTS: Settings = {
  showOverlay: true,
  showRules: true,
  showPhysics: false,
  population: 4000,
  physics: {
    maxDistance: 0.25,
    damping: 0.2,
    timeScale: 10.0,
    wallRepel: 0.125,
    wallForce: 0.01,
    particleSize: 6.0,
    useProportionalScaling: true,
    refPopulation: 1000,
    scalingRatio: 0.5,
    mouseRepel: 1.0,
  },
};
