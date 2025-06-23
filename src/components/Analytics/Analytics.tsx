import type { Config } from "@/types/simulation";

import { PhysicsTable } from "./components/PhysicsTable";
import { RulesTable } from "./components/RulesTable";

interface AnalyticsProps {
  config: Config;
  showPhysics?: boolean;
  showRules?: boolean;
}

export function Analytics({
  config,
  showPhysics = true,
  showRules = true,
}: AnalyticsProps) {
  return (
    <div className="flex flex-col gap-4 items-start">
      {showPhysics && <PhysicsTable physics={config.physics} />}
      {showRules && <RulesTable rules={config.rules} />}
    </div>
  );
}
