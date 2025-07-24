/**
 * Function to generate a markdown table to be "grafted" into `pdf.ts`
 * once we switch to a markdown-to-html & html-to-pdf setup
 */

import { marked } from "marked";

type TableAlignment = "l" | "c" | "r";

/**
 * Converts a table to HTML using markdown syntax.
 * @param params
 * @returns html string
 */
export async function tableToHtml(params: {
  columnNames: string[];
  data: string[][];
  alignments?: TableAlignment[];
  title?: string;
  outputPath?: string;
  footer?: string;
}): Promise<string> {
  const markdown = tableToMarkdown(
    params.columnNames,
    params.data,
    params.alignments,
    params.title,
    params.footer
  );
  return markdownToHtml(markdown);
}

/**
 * @param columnNames
 * @param data
 * @param alignments optional list of alignment options corresponding to each column name
 * @param title optional title for the table
 * @returns string
 */
function tableToMarkdown(
  columnNames: string[],
  data: string[][],
  alignments?: TableAlignment[],
  title?: string,
  footer?: string
): string {
  let out = "";
  if (title) {
    out += `# ${title}\n\n`;
  }
  let headerBorder = "";

  if (alignments) {
    if (columnNames.length != alignments?.length) {
      console.warn("Column names do not match up with alignments");
    }
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

  if (footer) {
    out += `## ${footer}\n\n`;
  }
  return out;
}

/**
 * @param markdown
 * @returns html string
 */
async function markdownToHtml(markdown: string): Promise<string> {
  const html = await marked.parse(markdown); // <table>...</table>
  const style = `
  <style>
    table {
      border-collapse: collapse;
      width: 100%;
    }

    th, td {
      border: 1px solid black;
      padding: 8px;
    }

    th {
      font-weight: bold;
    }
  </style>`;
  const content = html + style;

  return content;
}
