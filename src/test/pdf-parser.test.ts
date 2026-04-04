import { describe, expect, it, vi } from 'vitest';
import { extractTextFromPdf } from '@/lib/pdf-parser';

const mocks = vi.hoisted(() => {
  const getDocument = vi.fn();
  return { getDocument };
});

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: mocks.getDocument,
}));

describe('extractTextFromPdf', () => {
  it('concatenates text from all pages', async () => {
    mocks.getDocument.mockReturnValue({
      promise: Promise.resolve({
        numPages: 2,
        getPage: async (pageNumber: number) => ({
          getTextContent: async () => ({
            items: [
              { str: `Page${pageNumber}-a` },
              { str: `Page${pageNumber}-b` },
            ],
          }),
        }),
      }),
    });

    const file = {
      arrayBuffer: async () => new TextEncoder().encode('dummy').buffer,
    } as unknown as File;

    const text = await extractTextFromPdf(file);

    expect(text).toContain('Page1-a Page1-b');
    expect(text).toContain('Page2-a Page2-b');
  });
});
