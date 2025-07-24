import React from "react";

type Column = {
  key: string;
  label: string;
};

type TableProps = {
  columns: Column[];
  data: Record<string, React.ReactNode>[]; // mixed types, string or JSX
};

function ActivityLogTable({ columns, data }: TableProps) {
  return (
    <div className="w-[1000px] rounded-md overflow-hidden">
      <table className="w-full table-fixed border-collapse text-center">
        {/* Column widths */}
        <colgroup>
          <col className="w-[275px]" />
          <col className="w-[250px]" />
          <col className="w-[100px]" />
          <col className="w-[175px]" />
          <col className="w-[100px]" />
          <col className="w-[100px]" />
        </colgroup>

        {/* Table Head */}
        <thead>
          <tr className="bg-white h-[50px] text-black">
            {columns.map((col, index) => (
              <th
                key={col.key}
                className={`font-bold font-Poppins text-sm border-b border-border ${
                  index !== columns.length - 1 ? "border-r border-border" : ""
                }`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>

        {/* Table Body */}
        <tbody>
          {data.map((row, idx) => {
            const isEmpty = Object.values(row).every((val) => val === "");

            return (
              <tr
                key={idx}
                className="bg-white h-[50px] text-black font-Work-Sans text-sm border-b border-border"
              >
                {columns.map((col, index) => {
                  const isLotId = col.key === "lotId";
                  const cellContent = row[col.key];

                  return (
                    <td
                      key={col.key}
                      className={`align-middle px-1 ${
                        index !== columns.length - 1
                          ? "border-r border-border"
                          : ""
                      }`}
                      title={
                        isLotId && typeof cellContent === "string"
                          ? cellContent
                          : undefined
                      }
                    >
                      {isEmpty ? null : isLotId &&
                        typeof cellContent === "string" ? (
                        <span className="truncate block max-w-full">
                          {cellContent}
                        </span>
                      ) : (
                        cellContent
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default ActivityLogTable;
