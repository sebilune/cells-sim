export interface Physics {
  maxDistance: number;
  damping: number;
  timeScale: number;
  wallRepel: number;
  wallForce: number;
  particleSize: number;
  useProportionalScaling: boolean;
  refPopulation: number;
  scalingRatio: number;
  mouseRepel: boolean;
}

export interface Config {
  population: number;
  rules: number[][];
  physics: Physics;
}
