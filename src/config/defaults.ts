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
    particleSize: 3.0,
    mouseRepel: 1.0,
  },
};
