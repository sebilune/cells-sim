import type { Physics } from "@/types/simulation";

interface PhysicsTableProps {
  physics: Physics;
}

export function PhysicsTable({ physics }: PhysicsTableProps) {
  return (
    <div>
      <table className="border-collapse bg-transparent">
        <tbody>
          {Object.entries(physics).map(([key, value]) => (
            <tr
              key={key}
              className="bg-transparent border-b border-neutral-800 last:border-b-0"
            >
              <td className="font-medium whitespace-nowrap bg-transparent text-xs px-2 py-1 border-r border-neutral-700 text-neutral-100">
                {key}
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
