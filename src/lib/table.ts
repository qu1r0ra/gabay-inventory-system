/**
 * Function to generate a markdown table to be "grafted" into `pdf.ts`
 * once we switch to a markdown-to-html & html-to-pdf setup
 */

import { assert } from "console";

type TableAlignment = "l" | "c" | "r";

function table(
  columnNames: string[],
  data: string[][],
  alignments?: TableAlignment[]
) {
  let out = "";
  let headerBorder = "";

  if (alignments) {
    assert(
      columnNames.length == alignments?.length,
      "Column names do not match up with alignments"
    );
  }

  // Find longest string length
  const columnwiseMax = (matrix: number[][]) =>
    matrix[0].map((_, col) => Math.max(...matrix.map((row) => row[col])));

  const columnNamesLengths: number[] = columnNames.map((cell) => cell.length);
  const dataLengths: number[][] = data.map((row) =>
    row.map((cell) => cell.length)
  );
  dataLengths.push(columnNamesLengths);

  let padLengths: number[] = columnwiseMax(dataLengths);
  padLengths = padLengths.map((length: number) => Math.max(length, 4));

  // Padding convenience functions
  const padCenter = (columnNo: number, str: string, char: string = " ") =>
    str
      .padStart((str.length + padLengths[columnNo]) / 2, char)
      .padEnd(padLengths[columnNo], char);

  const padEnd = (columnNo: number, str: string, char: string = " ") =>
    str.padEnd(padLengths[columnNo], char);

  const padStart = (columnNo: number, str: string, char: string = " ") =>
    str.padStart(padLengths[columnNo], char);

  // Build the header row
  for (let i = 0; i < columnNames.length; i++) {
    const cell = columnNames[i];

    if (alignments) {
      const alignment = alignments[i];
      switch (alignment) {
        case "l":
          out += `| ${padEnd(i, cell)} `;
          headerBorder += `| ${padEnd(i, ":", "-")} `; // :---
          break;
        case "c":
          out += `| ${padCenter(i, cell)} `;
          headerBorder += `| :${"-".repeat(padLengths[i] - 2)}: `; // :---:
          break;
        case "r":
          out += `| ${padStart(i, cell)} `;
          headerBorder += `| ${padStart(i, ":", "-")} `; // ---:
          break;
        default:
          out += `| ${padEnd(i, cell)} `;
          headerBorder += `| ${padEnd(i, "", "-")} `;
          break;
      }
    } else {
      out += `| ${padEnd(i, cell)} `;
      headerBorder += `| ${padEnd(i, "", "-")} `;
    }
  }

  headerBorder += "|\n";
  out += "|\n" + headerBorder;

  // Build the data
  data.forEach((row) => {
    for (let i = 0; i < row.length; i++) {
      const cell = row[i];
      if (alignments) {
        const alignment = alignments[i];
        switch (alignment) {
          case "l":
            out += `| ${padEnd(i, cell)} `;
            break;
          case "c":
            out += `| ${padCenter(i, cell)} `;
            break;
          case "r":
            out += `| ${padStart(i, cell)} `;
            break;
          default:
            out += `| ${padEnd(i, cell)} `;
            break;
        }
      } else {
        out += `| ${padEnd(i, cell)} `;
      }
    }
    out += "|\n";
  });

  return out;
}

/**
 * Expected output:
 * | Item Name           | Lot ID |  Qty | Expiration Date | Last Modified |
 * | :------------------ | :----: | ---: | :-------------- | :-----------: |
 * | Antibiotic Ointment |  A-01  |   95 | 2025-08-10      |  2025-07-06   |
 * | Bandages            |  B-01  |  100 | 2030-12-31      |  2025-07-10   |
 */
function main() {
  const columnNames: string[] = [
    "Item Name",
    "Lot ID",
    "Qty",
    "Expiration Date",
    "Last Modified",
  ];
  const data: string[][] = [
    ["Antibiotic Ointment", "A-01", "95", "2025-08-10", "2025-07-06"],
    ["Bandages", "B-01", "100", "2030-12-31", "2025-07-10"],
  ];
  const alignments: TableAlignment[] = ["l", "c", "r", "l", "c"]; // optional
  const out = table(columnNames, data, alignments);
  console.log(out);
}

/**
 * Check if we're running this directly
 * Equivalent to python's `if __name__ == '__main__':`
 */
if (process.argv[1] === import.meta.filename) {
  main();
}
