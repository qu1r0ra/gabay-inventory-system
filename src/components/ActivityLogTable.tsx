import React from "react";
import def from "../assets/default.jpg";

type Column = {
  key: string;
  label: string;
};

type TableProps = {
  columns: Column[];
  data: Record<string, React.ReactNode>[];
};

function ActivityLogTable({ columns, data }: TableProps) {
  return (
    <div className="w-full max-w-[940px] border-white">
      <table className="table-auto w-full text-center text-sm text-white">
        <colgroup>
          <col className="w-[80px]" />
          <col className="w-[200px]" />
          <col className="w-[200px]" />
          <col className="w-[200px]" />
          <col className="w-[100px]" />
          <col className="w-[160px]" />
        </colgroup>
        <thead className="bg-primary">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="px-4 py-3 font-bold font-Poppins">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-secondary">
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="border-t border-white"
              style={{ height: "50px" }}
            >
              {columns.map((column) => (
                <td key={column.key} className="px-4 py-2 font-Work-Sans">
                  {column.key === "icon" ? (
                    <img
                      src={def}
                      alt="icon"
                      className="rounded-full w-[35px] h-[35px] mx-auto"
                    />
                  ) : (
                    row[column.key]
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ActivityLogTable;
