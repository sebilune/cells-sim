interface PhysicsTableProps {
  config: {
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
}

const LABELS: Record<string, string> = {
  maxDistance: "Max Distance",
  damping: "Damping",
  timeScale: "Time Scale",
  wallRepel: "Wall Repel",
  wallForce: "Wall Force",
  particleSize: "Particle Size",
  useProportionalScaling: "Proportional Scaling",
  refPopulation: "Reference Population",
  scalingRatio: "Scaling Ratio",
};

export function PhysicsTable({ config }: PhysicsTableProps) {
  return (
    <div>
      <table className="border-collapse bg-transparent">
        <tbody>
          {Object.entries(config).map(([key, value]) => (
            <tr
              key={key}
              className="bg-transparent border-b border-neutral-800 last:border-b-0"
            >
              <td className="font-medium whitespace-nowrap bg-transparent text-xs px-2 py-1 border-r border-neutral-700 text-neutral-100">
                {LABELS[key] || key}
              </td>
              <td className="whitespace-nowrap bg-transparent text-xs px-2 py-1 text-neutral-100">
                {typeof value === "boolean"
                  ? value
                    ? "true"
                    : "false"
                  : value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
