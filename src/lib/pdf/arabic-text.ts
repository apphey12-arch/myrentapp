import * as reshaper from 'arabic-persian-reshaper';

/**
 * jsPDF does not shape Arabic glyphs by default (letters may not connect).
 * This helper converts Arabic strings into presentation forms so they render
 * correctly in PDFs when combined with an Arabic-capable font.
 */
export const shapeArabic = (input: string): string => {
  try {
    // Library is CommonJS; keep types flexible.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ArabicShaper = (reshaper as any)?.ArabicShaper;
    if (!ArabicShaper?.convertArabic) return input;
    return ArabicShaper.convertArabic(input);
  } catch {
    return input;
  }
};
