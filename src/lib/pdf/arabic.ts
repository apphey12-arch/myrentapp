import ArabicReshaper from 'arabic-reshaper';

import type { PdfLanguage } from './translations';

const ARABIC_CHAR_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;

export const containsArabic = (text: string): boolean => ARABIC_CHAR_REGEX.test(text);

/**
 * jsPDF does not do Arabic shaping, so we must pre-shape Arabic text to get connected letters.
 * We only reshape when the string contains Arabic characters.
 */
export const shapeText = (text: string, language: PdfLanguage): string => {
  if (!text) return '';
  if (language !== 'ar') return text;
  if (!containsArabic(text)) return text;

  try {
    return ArabicReshaper.convertArabic(text);
  } catch (e) {
    console.error('[PDF] Arabic shaping failed:', e);
    return text;
  }
};
