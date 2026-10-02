import type { MethodTableColumn, MethodTableGroup } from "@/lib/methodology-doc";
import { displayTableCell, parseClientSweep } from "@/lib/parse-methodology";
import { cn } from "@/lib/utils";

import { SPEC_CELL_CLASS, SPEC_HEAD_CLASS } from "./spec-table";

export function MethodTable({
  caption,
  columns,
  grouped,
  groups,
}: {
  caption: string;
  columns: MethodTableColumn[];
  grouped: boolean;
  groups: MethodTableGroup[];
}) {
  return (
    <div className="-mx-page overflow-x-auto px-page">
      <table
        className="w-full max-w-[52rem] border-collapse text-left"
        style={{ minWidth: grouped ? "40rem" : "34rem" }}
      >
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-border">
            {columns.map((column, columnIndex) => (
              <th
                className={cn(
                  SPEC_HEAD_CLASS,
                  column.align === "right" && "text-right",
                  column.hideBelow === "sm" && "hidden sm:table-cell",
                  edgePadding(columnIndex, columns.length),
                )}
                key={column.key}
                scope="col"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grouped
            ? groups.map((group) => (
                <GroupedRows columns={columns} group={group} key={group.label} />
              ))
            : groups.flatMap((group) =>
                group.rows.map((cells, rowIndex) => (
                  <tr
                    className="border-b border-border/60"
                    key={`${group.label}-${rowIndex}`}
                  >
                    {columns.map((column, columnIndex) => (
                      <td className={cellClass(column, columnIndex, columns.length)} key={column.key}>
                        <TableCell
                          column={column}
                          value={cells[columnIndex] ?? ""}
                        />
                      </td>
                    ))}
                  </tr>
                )),
              )}
        </tbody>
      </table>
    </div>
  );
}

function GroupedRows({
  columns,
  group,
}: {
  columns: MethodTableColumn[];
  group: MethodTableGroup;
}) {
  return group.rows.map((cells, rowIndex) => {
    const first = rowIndex === 0;
    return (
      <tr
        className={first ? "border-t border-border" : "border-b border-border/60"}
        key={`${group.label}-${rowIndex}`}
      >
        {columns.map((column, columnIndex) => {
          if (column.spanGroup && !first) return null;
          const Cell = columnIndex === 0 ? "th" : "td";
          return (
            <Cell
              className={cellClass(column, columnIndex, columns.length)}
              key={column.key}
              rowSpan={column.spanGroup ? group.rows.length : undefined}
              scope={columnIndex === 0 ? "row" : undefined}
            >
              {columnIndex === 0 ? (
                <>
                  <span className="font-medium tracking-tight">{group.label}</span>
                  {group.comment ? (
                    <span className="mt-1 block max-w-[11rem] text-[12px] font-normal leading-snug text-muted-foreground">
                      {group.comment}
                    </span>
                  ) : null}
                </>
              ) : (
                <TableCell column={column} value={cells[columnIndex] ?? ""} />
              )}
            </Cell>
          );
        })}
      </tr>
    );
  });
}

function edgePadding(columnIndex: number, columnCount: number) {
  return cn(columnIndex === 0 && "pl-0", columnIndex === columnCount - 1 && "pr-0");
}

function cellClass(column: MethodTableColumn, columnIndex: number, columnCount: number) {
  return cn(
    SPEC_CELL_CLASS,
    column.align === "right" && "text-right",
    column.mono && "font-mono text-[13px] tracking-tight tabular-nums",
    column.hideBelow === "sm" && "hidden sm:table-cell",
    edgePadding(columnIndex, columnCount),
  );
}

function isTier(column: MethodTableColumn) {
  return column.header.toLowerCase() === "tier";
}

function isClients(column: MethodTableColumn) {
  const header = column.header.toLowerCase();
  return header === "clients" || header === "client sweep";
}

function TableCell({
  column,
  value,
}: {
  column: MethodTableColumn;
  value: string;
}) {
  const displayed = displayTableCell(value);
  if (displayed !== value || /^n\/a$/i.test(value)) {
    return <span className="text-muted-foreground">{displayed}</span>;
  }
  if (column.muted) {
    return <span className="text-muted-foreground">{displayed}</span>;
  }
  if (isTier(column)) {
    return <span className="font-medium tracking-tight">{displayed}</span>;
  }
  if (isClients(column)) {
    return <ClientSweep value={displayed} />;
  }
  return displayed;
}

function ClientSweep({ value }: { value: string }) {
  const counts = parseClientSweep(value);
  if (!counts) return value;
  const first = counts[0]!;
  const last = counts[counts.length - 1]!;
  const listed = counts.join(", ");
  const label = `Client sweep ${listed}. Published results use ${last} clients.`;
  return (
    <span className="tabular-nums" title={label}>
      <span className="sr-only">{label}</span>
      <span aria-hidden="true">
        <span className="text-muted-foreground">{first}–</span>
        {last}
      </span>
    </span>
  );
}
