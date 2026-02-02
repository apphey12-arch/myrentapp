import jsPDF from 'jspdf';
import { fetchArabicFontBase64 } from '@/lib/pdf-amiri-base64';

/**
 * Registers and selects an Arabic-capable font (Cairo).
 * Fetches font from Google Fonts CDN at runtime to avoid build bloat.
 * Returns a Promise - must be awaited before PDF generation.
 */
export const applyArabicFont = async (pdf: jsPDF): Promise<void> => {
  try {
    // NOTE: despite the name, this returns a *binary string* of the TTF file
    // (to keep public API stable while avoiding build-breaking embedded strings).
    const fontBinary = await fetchArabicFontBase64();
    
    if (!fontBinary || fontBinary.length < 1000) {
      console.warn('Cairo font data is empty or too small, falling back to helvetica');
      pdf.setFont('helvetica', 'normal');
      return;
    }

    // Register Cairo font in jsPDF virtual file system
    pdf.addFileToVFS('Cairo-Regular.ttf', fontBinary);
    pdf.addFont('Cairo-Regular.ttf', 'Cairo', 'normal');
    pdf.setFont('Cairo', 'normal');

    // Enable RTL text direction for Arabic
    (pdf as any).setR2L?.(true);
  } catch (error) {
    console.error('Failed to apply Arabic font, falling back to helvetica:', error);
    pdf.setFont('helvetica', 'normal');
  }
};
