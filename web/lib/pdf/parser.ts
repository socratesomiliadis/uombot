import pdfParse from "pdf-parse";

export interface PDFMetadata {
  title?: string;
  author?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
  keywords?: string;
  subject?: string;
}

export interface PDFParseResult {
  text: string;
  numPages: number;
  metadata: PDFMetadata;
  info: any;
}

export class PDFParser {
  async extractText(pdfBuffer: Buffer): Promise<PDFParseResult> {
    try {
      const data = await pdfParse(pdfBuffer);

      return {
        text: data.text,
        numPages: data.numpages,
        metadata: this.extractMetadata(data.info),
        info: data.info,
      };
    } catch (error) {
      console.error("PDF parsing error:", error);
      throw new Error(
        `Failed to parse PDF: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private extractMetadata(info: any): PDFMetadata {
    return {
      title: info?.Title || undefined,
      author: info?.Author || undefined,
      creator: info?.Creator || undefined,
      producer: info?.Producer || undefined,
      creationDate: info?.CreationDate
        ? new Date(info.CreationDate)
        : undefined,
      modificationDate: info?.ModDate ? new Date(info.ModDate) : undefined,
      keywords: info?.Keywords || undefined,
      subject: info?.Subject || undefined,
    };
  }

  /**
   * Validate if the buffer contains a valid PDF
   */
  isValidPDF(buffer: Buffer): boolean {
    // Check for PDF magic number at the start
    const pdfHeader = buffer.slice(0, 4).toString();
    return pdfHeader === "%PDF";
  }

  /**
   * Clean and normalize extracted text
   */
  cleanText(text: string): string {
    return (
      text
        // Remove excessive whitespace
        .replace(/\s+/g, " ")
        // Remove page headers/footers patterns (common patterns)
        .replace(/Page \d+ of \d+/gi, "")
        .replace(/^\d+\s*$/gm, "") // Remove standalone page numbers
        // Normalize line breaks
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        // Remove excessive newlines
        .replace(/\n\s*\n\s*\n/g, "\n\n")
        // Trim
        .trim()
    );
  }
}

export const pdfParser = new PDFParser();
