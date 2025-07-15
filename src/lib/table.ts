/**
 * Function to generate a markdown table to be "grafted" into `pdf.ts`
 * once we switch to a markdown-to-html & html-to-pdf setup
 */

import { assert } from "console";
import { marked } from "marked";
import html_to_pdf from "html-pdf-node";
import { readFileSync, writeFileSync } from "fs";

type TableAlignment = "l" | "c" | "r";

/**
 * @param columnNames
 * @param data
 * @param alignments optional list of alignment options corresponding to each column name
 * @returns string
 */
function tableToMarkdown(
  columnNames: string[],
  data: string[][],
  alignments?: TableAlignment[]
): string {
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
 * @warn The html_to_pdf library doesn't seem to respect
 *       table alignment options. The alternatives would be to run a headless
 *       browser, but that might use too much processing power.
 * @param markdown
 * @param outputPath If provided, saves to this path
 * @returns PDF blob
 */
async function markdownToPdf(
  markdown: string,
  outputPath?: string
): Promise<Blob> {
  // Parse markdown table into rows
  const html = await marked.parse(markdown); // <table>...</table>
  const style = `<style>${readFileSync("table-style.css")}</style>`;
  const file = { content: html + style };
  const options = { format: "A4" };

  // "Compiling the template with handlebars" appears here
  const pdf = await html_to_pdf.generatePdf(file, options);
  if (outputPath) writeFileSync(outputPath, pdf);

  return pdf;
}

/**
 * Expected output:
 * | Item Name           | Lot ID |  Qty | Expiration Date | Last Modified |
 * | :------------------ | :----: | ---: | :-------------- | :-----------: |
 * | Antibiotic Ointment |  A-01  |   95 | 2025-08-10      |  2025-07-06   |
 * | Bandages            |  B-01  |  100 | 2030-12-31      |  2025-07-10   |
 */
async function main() {
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

  // optional
  const alignments: TableAlignment[] = ["l", "c", "r", "l", "c"];

  const out: string = tableToMarkdown(columnNames, data, alignments);

  // if output path is provided, file is saved there
  const pdf: Blob = await markdownToPdf(out, "test.pdf");
}

/**
 * Check if we're running this directly
 * Equivalent to python's `if __name__ == '__main__':`
 */
if (process.argv[1] === import.meta.filename) {
  await main();
}
