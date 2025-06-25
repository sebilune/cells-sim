interface RulesTableProps {
  rules: number[][];
  rowLabels?: string[];
  colLabels?: string[];
}

export function RulesTable({ rules, rowLabels, colLabels }: RulesTableProps) {
  const size = rules.length;
  const defaultLabels = ["Red", "Green", "Blue", "Yellow", "Cyan", "Magenta"];
  const rows = rowLabels || defaultLabels.slice(0, size);
  const cols = colLabels || defaultLabels.slice(0, size);

  return (
    <div>
      <table className="bg-transparent border-collapse">
        <thead>
          <tr>
            <th className="bg-transparent border-b whitespace-nowrap border-neutral-700"></th>
            {cols.map((col, j) => (
              <th
                key={j}
                className="px-2 py-1 text-xs font-semibold bg-transparent border-b whitespace-nowrap border-neutral-700 text-neutral-100"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rules.map((row, i) => (
            <tr
              key={i}
              className="bg-transparent border-b border-neutral-800 last:border-b-0"
            >
              <td className="px-2 py-1 text-xs font-medium bg-transparent border-r whitespace-nowrap border-neutral-700 text-neutral-100">
                {rows[i]}
              </td>
              {row.map((val, j) => (
                <td
                  key={j}
                  className="px-2 py-1 text-xs bg-transparent border-r whitespace-nowrap border-neutral-800 last:border-r-0 text-neutral-100"
                >
                  {val.toFixed(2)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
