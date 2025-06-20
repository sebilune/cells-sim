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
      <table className="border-collapse bg-transparent">
        <thead>
          <tr>
            <th className="whitespace-nowrap bg-transparent border-b border-neutral-700"></th>
            {cols.map((col, j) => (
              <th
                key={j}
                className="whitespace-nowrap bg-transparent font-semibold text-xs px-2 py-1 border-b border-neutral-700 text-neutral-100"
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
              <td className="font-medium whitespace-nowrap bg-transparent text-xs px-2 py-1 border-r border-neutral-700 text-neutral-100">
                {rows[i]}
              </td>
              {row.map((val, j) => (
                <td
                  key={j}
                  className="whitespace-nowrap bg-transparent text-xs px-2 py-1 border-r border-neutral-800 last:border-r-0 text-neutral-100"
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
