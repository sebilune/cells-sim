import { PhysicsTable } from "./components/PhysicsTable";
import { RulesTable } from "./components/RulesTable";

interface AnalyticsProps {
  config: {
    population: number;
    maxDistance: number;
    damping: number;
    timeScale: number;
    wallRepel: number;
    wallForce: number;
    particleSize: number;
    useProportionalScaling: boolean;
    refPopulation: number;
    scalingRatio: number;
  };
  rules: number[][];
  showPhysics?: boolean;
  showRules?: boolean;
}

export function Analytics({
  config,
  rules,
  showPhysics = true,
  showRules = true,
}: AnalyticsProps) {
  return (
    <div className="flex flex-col gap-4 items-start">
      {showPhysics && <PhysicsTable config={config} />}
      {showRules && <RulesTable rules={rules} />}
    </div>
  );
}
