/**
 * @ Author: CSSWENG Group 1
 * @ Create Time: 2025-07-12 11:03:10
 * @ Modified time: 2025-07-14 09:52:27
 * @ Description:
 *
 * A class that helps with PDF creation.
 * Wrapper around pdf-lib js.
 */

import {
  PDFDocument,
  PDFPage,
  PDFFont,
  StandardFonts,
  setCharacterSpacing,
} from "pdf-lib";

/**
 * Wrapper around the PDFPage class so we can use some cool-ass methods to build PDFs.
 * You'll see B).
 */
class Page {
  private doc: Document | undefined;
  private page: PDFPage | undefined;
  private width: number | undefined;
  private height: number | undefined;
  private bodyFont: PDFFont | undefined;
  private titleFont: PDFFont | undefined;
  private currentY: number = 0;

  constructor(
    page: PDFPage,
    doc: Document,
    bodyFont: PDFFont,
    titleFont: PDFFont
  ) {
    const { width, height } = page.getSize();
    this.doc = doc;
    this.page = page;
    this.width = width;
    this.height = height;
    this.bodyFont = bodyFont;
    this.titleFont = titleFont;
  }

  /**
   * Creates a header.
   *
   * @param text
   * @param size
   */
  header(
    text: string,
    {
      size = 1,
      alignment = "left",
    }: {
      size?: number;
      alignment?: "left" | "center" | "right";
    }
  ) {
    const characterSpacing = -2;
    const lineHeight = 2;
    const sizes = [48, 36, 32, 24, 16, 14];
    const textWidth =
      this.titleFont!.widthOfTextAtSize(text, sizes[size]) +
      text.length * characterSpacing;
    const textHeight = this.titleFont!.heightAtSize(sizes[size]);
    this.currentY += (textHeight * lineHeight) / 2;
    this.page?.pushOperators(setCharacterSpacing(characterSpacing));
    this.page?.drawText(text, {
      x:
        alignment === "left"
          ? this.getXPadding()
          : alignment === "right"
          ? this.width! - textWidth - this.getXPadding()
          : alignment === "center"
          ? this.width! / 2 - textWidth / 2
          : this.getXPadding(),
      y: this.getCurrentY(),
      size: sizes[size],
      font: this.titleFont,
    });
    this.currentY += (textHeight * lineHeight) / 2;
    this.page?.pushOperators(setCharacterSpacing(0));
    return this;
  }

  /**
   * Note that x and y range from 0-1 and represent percentages of the width and height.
   * This normalizes our coordinate system.
   *
   * @param text
   * @param x
   * @param y
   */
  text(text: string) {
    const bodyFontSize = 12;
    const lineHeight = 1.25;
    this.page?.drawText(text, {
      x: this.getXPadding(),
      y: this.getCurrentY(),
      size: bodyFontSize,
      font: this.bodyFont,
    });
    const textHeight = this.bodyFont!.heightAtSize(bodyFontSize);
    this.currentY += textHeight * lineHeight;
    return this;
  }

  /**
   * Returns the parent document.
   * Returns us to parent context.
   *
   * @returns
   */
  endPage(): Document {
    return this.doc!;
  }

  private getCurrentY() {
    return this.height! - this.currentY - this.getYPadding();
  }

  private getXPadding() {
    return 0.1 * this.width!;
  }

  private getYPadding() {
    return 0.1 * this.width!;
  }
}

/**
 * A wrapper around the pdf lib class.
 */
export class Document {
  private doc: PDFDocument | undefined;
  private filename: string | undefined;
  private bodyFont: PDFFont | undefined;
  private titleFont: PDFFont | undefined;

  /**
   * Private constructor.
   * Uses DI to instantiate PDF.
   *
   * @param doc
   */
  private constructor(
    doc: PDFDocument,
    bodyFont: PDFFont,
    titleFont: PDFFont,
    filename: string
  ) {
    this.doc = doc;
    this.filename = filename;
    this.bodyFont = bodyFont;
    this.titleFont = titleFont;
  }

  /**
   * This is the only way to instantiate this class.
   * Recommended because we have an async initializer, which we can't place in constructor.
   *
   * @returns
   */
  static async new(filename: string): Promise<Document> {
    const pdfDoc = await PDFDocument.create();
    const bodyFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const newDocument = new Document(pdfDoc, bodyFont, titleFont, filename);
    return newDocument;
  }

  /**
   * Returns a new page instance.
   * Gives us access to page methods.
   *
   * @returns
   */
  beginPage() {
    const page = this.doc!.addPage();
    return new Page(page, this, this.bodyFont!, this.titleFont!);
  }

  /**
   * Takes in as input the bytes of a pdf.
   * Refer to this screenshot so u can pass in data from html2pdf.js:
   * https://snipboard.io/VuCXPd.jpg
   *
   * @param buffer
   */
  async appendDocument(buffer: Uint8Array) {
    const embeddedDoc = await PDFDocument.load(buffer);
    const embeddedPages = await this.doc!.copyPages(
      embeddedDoc,
      embeddedDoc.getPageIndices()
    );
    embeddedPages.forEach((page) => this.doc!.addPage(page));
    return this;
  }

  /**
   * Saves the pdf and returns a url to the created resource in memory.
   */
  async save() {
    const bytes = await this.doc!.save();
    const blob = new Blob([bytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    return url;
  }
}
