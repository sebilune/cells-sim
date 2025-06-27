import type { Physics } from "@/types/simulation";

interface PhysicsTableProps {
  physics: Physics;
}

export function PhysicsTable({ physics }: PhysicsTableProps) {
  return (
    <div>
      <table className="bg-transparent border-collapse">
        <tbody>
          {Object.entries(physics).map(([key, value]) => (
            <tr
              key={key}
              className="bg-transparent border-b border-neutral-800 last:border-b-0"
            >
              <td className="px-2 py-1 text-xs font-medium bg-transparent border-r whitespace-nowrap border-neutral-700 text-neutral-100">
                {key}
              </td>
              <td className="px-2 py-1 text-xs bg-transparent whitespace-nowrap text-neutral-100">
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
