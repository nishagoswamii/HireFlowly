import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.js?url';

// Use a locally bundled worker to avoid CDN/runtime dependency failures.
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

function extractItemText(item: unknown): string {
  if (typeof item !== 'object' || item === null) {
    return '';
  }

  const maybeRecord = item as Record<string, unknown>;
  return typeof maybeRecord.str === 'string' ? maybeRecord.str : '';
}

export async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  const textParts: string[] = [];
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => extractItemText(item))
      .filter((text) => text.length > 0)
      .join(' ');
    textParts.push(pageText);
  }
  
  return textParts.join('\n\n');
}
