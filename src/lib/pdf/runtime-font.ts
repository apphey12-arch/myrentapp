import jsPDF from 'jspdf';
import { shapeArabic } from '@/lib/pdf/arabic-text';

// User-required Cairo TTF (supports Arabic + Latin)
const CAIRO_TTF_URL = 'https://fonts.gstatic.com/s/cairo/v20/SLXGc1nY6HkvangtZmpcMw.ttf';

let cachedCairoTtfBase64: string | null = null;

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000; // avoid call stack limits
  let binary = '';

  for (let i = 0; i < bytes.length; i += chunkSize) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    binary += String.fromCharCode(...(bytes.subarray(i, i + chunkSize) as any));
  }

  return btoa(binary);
};

const isCairoRegistered = (pdf: jsPDF): boolean => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getFontList = (pdf as any).getFontList as undefined | (() => Record<string, unknown>);
  const list = getFontList?.();
  return Boolean(list && typeof list === 'object' && 'Cairo' in list);
};

export const ensureCairoFont = async (pdf: jsPDF): Promise<void> => {
  if (isCairoRegistered(pdf)) {
    pdf.setFont('Cairo', 'normal');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (pdf as any).setR2L?.(true);
    return;
  }

  try {
    if (!cachedCairoTtfBase64) {
      console.info('[PDF] Fetching Cairo font (TTF) for Arabic export');
      const res = await fetch(CAIRO_TTF_URL, { mode: 'cors' });
      if (!res.ok) {
        throw new Error(`Cairo font fetch failed: ${res.status}`);
      }
      const buffer = await res.arrayBuffer();
      cachedCairoTtfBase64 = arrayBufferToBase64(buffer);
    }

    pdf.addFileToVFS('Cairo-Regular.ttf', cachedCairoTtfBase64);
    pdf.addFont('Cairo-Regular.ttf', 'Cairo', 'normal');
    pdf.setFont('Cairo', 'normal');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (pdf as any).setR2L?.(true);
  } catch (e) {
    console.error('[PDF] Failed to embed Cairo font; Arabic rendering may break.', e);
    throw e;
  }
};

export const setupPdfForLanguage = async (pdf: jsPDF, language: 'en' | 'ar') => {
  const isArabic = language === 'ar';
  if (isArabic) {
    await ensureCairoFont(pdf);
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (pdf as any).setR2L?.(false);
    pdf.setFont('helvetica', 'normal');
  }

  const t = (s: string) => (isArabic ? shapeArabic(s) : s);
  return { isArabic, t };
};
