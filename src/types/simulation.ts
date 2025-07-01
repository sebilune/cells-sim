export interface Physics {
  maxDistance: number;
  damping: number;
  timeScale: number;
  wallRepel: number;
  wallForce: number;
  particleSize: number;
  mouseRepel: number;
}

export type Rules = number[][];

export interface Config {
  population: number;
  rules: Rules;
  physics: Physics;
}

interface Overlay {
  showOverlay: boolean;
  showRules: boolean;
  showPhysics: boolean;
}

export interface Settings extends Overlay {
  population: number;
  physics: Physics;
}
