import React from "react";
import NumberStepper from "./NumberStepper";

type Column = {
  key: string;
  label: string;
};

type TableProps = {
  columns: Column[];
  data: Record<string, React.ReactNode>[];
};

function InventoryTable({ columns, data }: TableProps) {
  return (
    <div className="w-[1000px] rounded-md overflow-hidden">
      <table className="w-full table-fixed border-collapse text-center">
        {/* Column widths */}
        <colgroup>
          <col className="w-[220px]" /> {/* Item Name */}
          <col className="w-[180px]" /> {/* Lot ID */}
          <col className="w-[75px]" />
          <col className="w-[200px]" />
          <col className="w-[200px]" />
          <col className="w-[125px]" />
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
                {columns.map((col, index) => (
                  <td
                    key={col.key}
                    className={`align-middle ${
                      index !== columns.length - 1
                        ? "border-r border-border"
                        : ""
                    }`}
                  >
                    {col.key === "action" ? (
                      isEmpty ? null : (
                        <div className="flex justify-center items-center">
                          <NumberStepper
                            min={0}
                            max={999}
                            initial={0}
                            onChange={(val) =>
                              console.log(`Row ${idx} changed to:`, val)
                            }
                          />
                        </div>
                      )
                    ) : (
                      row[col.key]
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default InventoryTable;
