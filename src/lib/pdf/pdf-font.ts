import jsPDF from 'jspdf';
import { AMIRI_TTF_BASE64 } from '@/lib/pdf-amiri-base64';

/**
 * Registers and selects an embedded Arabic-capable font.
 *
 * IMPORTANT:
 * - No runtime fetching.
 * - The font is bundled as a base64 data-uri via Vite's `?inline` import.
 */
export const applyArabicFont = (pdf: jsPDF) => {
  const base64 = AMIRI_TTF_BASE64;
  if (!base64 || base64.length < 1000) {
    throw new Error('Embedded Amiri font base64 is empty');
  }

  pdf.addFileToVFS('Amiri-Regular.ttf', base64);
  pdf.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
  pdf.setFont('Amiri', 'normal');

  // jsPDF RTL support flag (text direction). This helps alignment but does not do Arabic shaping.
  // Still required to avoid mis-ordered rendering.
  (pdf as any).setR2L?.(true);
};
