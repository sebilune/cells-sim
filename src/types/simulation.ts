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
  mouseRepel: number; // Now a float between 0.0 and 5.0
}

export interface Config {
  population: number;
  rules: number[][];
  physics: Physics;
}
