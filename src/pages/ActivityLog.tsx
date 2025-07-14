import React from "react";

interface Column {
  key: string;
  label: string;
}

interface Props {
  columns: Column[];
  data: any[];
}

function ActivityLogTable({ columns, data }: Props) {
  return (
    <table className="w-[1000px] border-collapse border border-black/70 table-fixed">
      <colgroup>
        {columns.map((col, idx) => (
          <col key={col.key} style={{ width: `${1000 / columns.length}px` }} />
        ))}
      </colgroup>
      <thead>
        <tr className="bg-[#F3F3F3] text-sm font-Poppins font-semibold text-center border-b border-black/70">
          {columns.map((col) => (
            <th key={col.key} className="px-2 py-2">
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, rowIndex) => (
          <tr
            key={rowIndex}
            className="text-sm text-center font-Work-Sans border-b border-black/30"
          >
            {columns.map((col) => (
              <td
                key={col.key}
                className="px-2 py-1 truncate max-w-[150px] overflow-hidden text-ellipsis"
                title={row[col.key] || ""}
              >
                {row[col.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default ActivityLogTable;
