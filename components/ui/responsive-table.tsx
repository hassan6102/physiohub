import { cn } from "@/lib/utils/cn";

export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  /** Shown as the card title on mobile. */
  primary?: boolean;
  /** Hide on mobile cards. */
  hideOnCard?: boolean;
  className?: string;
};

/** Table on md+ screens, stacked cards on phones (no horizontal scrolling). */
export function ResponsiveTable<T extends { id: string }>({
  rows,
  columns,
  onRowClick,
  actions,
}: {
  rows: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  actions?: (row: T) => React.ReactNode;
}) {
  const primary = columns.find((c) => c.primary) ?? columns[0];
  const secondary = columns.filter((c) => c !== primary && !c.hideOnCard);

  return (
    <>
      <div className="card hidden overflow-hidden md:block">
        <table className="w-full text-sm">
          <thead className="bg-canvas text-start text-xs text-muted">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={cn("px-4 py-3 text-start font-semibold", c.className)}>
                  {c.header}
                </th>
              ))}
              {actions && <th className="w-12 px-4 py-3" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((row) => (
              <tr
                key={row.id}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn("transition-colors", onRowClick && "cursor-pointer hover:bg-canvas")}
              >
                {columns.map((c) => (
                  <td key={c.key} className={cn("px-4 py-3 align-middle", c.className)}>
                    {c.cell(row)}
                  </td>
                ))}
                {actions && (
                  <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                    {actions(row)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-3 md:hidden">
        {rows.map((row) => (
          <li
            key={row.id}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className={cn("card space-y-2 p-4", onRowClick && "cursor-pointer active:bg-canvas")}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 font-semibold text-ink">{primary.cell(row)}</div>
              {actions && <div onClick={(e) => e.stopPropagation()}>{actions(row)}</div>}
            </div>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
              {secondary.map((c) => (
                <div key={c.key} className="min-w-0">
                  <dt className="text-xs text-muted">{c.header}</dt>
                  <dd className="truncate text-ink">{c.cell(row)}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}
