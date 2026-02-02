import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import type { PdfLanguage } from '../translations';

export const ensureCairoFontLoaded = async (): Promise<void> => {
  // Cairo is imported globally in src/index.css; wait until the browser finishes loading it.
  // (document.fonts is supported in modern browsers; safely no-op if not available.)
  const fonts = (document as any).fonts as FontFaceSet | undefined;
  if (!fonts) return;

  try {
    // Trigger font load for common weights.
    await Promise.all([
      fonts.load('400 16px Cairo'),
      fonts.load('700 16px Cairo'),
    ]);
    await fonts.ready;
  } catch (e) {
    // Don’t fail export just because font loading signals aren’t available.
    console.warn('[PDF][DOM] Cairo font load wait failed (continuing).', e);
  }
};

export const mountOffscreen = (node: HTMLElement): (() => void) => {
  const container = document.createElement('div');
  container.setAttribute('data-pdf-offscreen', 'true');
  container.style.position = 'fixed';
  container.style.left = '-100000px';
  container.style.top = '0';
  container.style.width = '0';
  container.style.height = '0';
  container.style.overflow = 'hidden';
  container.appendChild(node);
  document.body.appendChild(container);

  return () => {
    try {
      document.body.removeChild(container);
    } catch {
      // ignore
    }
  };
};

const mmToPx = (mm: number, dpi = 96) => Math.round((mm / 25.4) * dpi);

export const renderElementToPdf = async (opts: {
  element: HTMLElement;
  filename: string;
  language: PdfLanguage;
}): Promise<void> => {
  const { element, filename, language } = opts;
  const cleanup = mountOffscreen(element);

  try {
    if (language === 'ar') {
      await ensureCairoFontLoaded();
    }

    // A4 @ 96dpi is roughly 794x1123 px. We enforce a stable width so layout is predictable.
    // We also provide windowWidth to html2canvas to reduce “wrapped differently” issues.
    const a4WidthPx = mmToPx(210);

    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      logging: false,
      windowWidth: a4WidthPx,
    });

    const imgData = canvas.toDataURL('image/png', 1.0);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const margin = 10;
    const usableWidth = pageWidth - margin * 2;

    const imgWidth = usableWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let y = margin;

    (pdf as any).addImage(imgData, 'PNG', margin, y, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight - margin * 2;

    while (heightLeft > 0) {
      pdf.addPage();
      y = margin - (imgHeight - heightLeft);
      (pdf as any).addImage(imgData, 'PNG', margin, y, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight - margin * 2;
    }

    pdf.save(filename);
  } finally {
    cleanup();
  }
};
