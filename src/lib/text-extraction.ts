import "server-only";

const DOCX_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export async function extractTextFromFile(file: File): Promise<string> {
  if (file.type === "text/plain" || file.type === "text/markdown") {
    return file.text();
  }

  if (file.type === "application/pdf") {
    const { PDFParse } = await import("pdf-parse");
    const buffer = Buffer.from(await file.arrayBuffer());
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result.text;
    } finally {
      await parser.destroy();
    }
  }

  if (file.type === DOCX_TYPE) {
    const mammoth = await import("mammoth");
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  // Images and other formats need real OCR/vision, not yet wired in —
  // return empty so the caller can fall back gracefully instead of guessing.
  return "";
}
