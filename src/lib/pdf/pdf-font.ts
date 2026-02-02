import jsPDF from 'jspdf';
import { fetchAmiriFontBase64 } from '@/lib/pdf-amiri-base64';

/**
 * Registers and selects an Arabic-capable font (Amiri).
 * Fetches font from CDN at runtime to avoid build bloat.
 * Returns a Promise - must be awaited before PDF generation.
 */
export const applyArabicFont = async (pdf: jsPDF): Promise<void> => {
  try {
    const base64 = await fetchAmiriFontBase64();
    
    if (!base64 || base64.length < 1000) {
      console.warn('Amiri font base64 is empty or too small, falling back to helvetica');
      pdf.setFont('helvetica', 'normal');
      return;
    }

    pdf.addFileToVFS('Amiri-Regular.ttf', base64);
    pdf.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
    pdf.setFont('Amiri', 'normal');

    // jsPDF RTL support flag (text direction)
    (pdf as any).setR2L?.(true);
  } catch (error) {
    console.error('Failed to apply Arabic font, falling back to helvetica:', error);
    pdf.setFont('helvetica', 'normal');
  }
};
