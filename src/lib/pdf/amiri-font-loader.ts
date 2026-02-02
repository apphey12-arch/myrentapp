import jsPDF from 'jspdf';

/**
 * Amiri Font Loader for jsPDF
 * 
 * Amiri is a professional Arabic font that fully supports BOTH Arabic and Latin characters.
 * This allows mixed-language PDFs without garbage characters.
 * 
 * CDN Source: https://cdnjs.cloudflare.com/ajax/libs/amiri-font/0.117/Amiri-Regular.ttf
 */

const AMIRI_FONT_URL = 'https://cdnjs.cloudflare.com/ajax/libs/amiri-font/0.117/Amiri-Regular.ttf';

let cachedAmiriFontBase64: string | null = null;

/**
 * Convert ArrayBuffer to Base64 string
 */
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000; // 32KB chunks to avoid call stack limits
  let binary = '';

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...Array.from(chunk));
  }

  return btoa(binary);
};

/**
 * Check if Amiri font is already registered in the PDF document
 */
const isAmiriRegistered = (pdf: jsPDF): boolean => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fontList = (pdf as any).getFontList?.() as Record<string, unknown> | undefined;
    return Boolean(fontList && 'Amiri' in fontList);
  } catch {
    return false;
  }
};

/**
 * Fetch Amiri font from CDN, convert to Base64, and cache it
 */
const fetchAmiriFont = async (): Promise<string> => {
  if (cachedAmiriFontBase64) {
    return cachedAmiriFontBase64;
  }

  console.info('[PDF] Fetching Amiri font from CDN...');
  
  const response = await fetch(AMIRI_FONT_URL, { 
    mode: 'cors',
    cache: 'force-cache' // Browser will cache the font
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch Amiri font: ${response.status} ${response.statusText}`);
  }
  
  const arrayBuffer = await response.arrayBuffer();
  const base64 = arrayBufferToBase64(arrayBuffer);
  
  cachedAmiriFontBase64 = base64;
  console.info('[PDF] Amiri font loaded and cached successfully');
  
  return base64;
};

/**
 * Embed Amiri font into the PDF document
 * This font supports both Arabic and Latin characters
 */
export const embedAmiriFont = async (pdf: jsPDF): Promise<void> => {
  if (isAmiriRegistered(pdf)) {
    pdf.setFont('Amiri', 'normal');
    return;
  }

  try {
    const fontBase64 = await fetchAmiriFont();
    
    // Add font to Virtual File System
    pdf.addFileToVFS('Amiri-Regular.ttf', fontBase64);
    
    // Register the font
    pdf.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
    
    // Set as active font
    pdf.setFont('Amiri', 'normal');
    
    console.info('[PDF] Amiri font embedded successfully');
  } catch (error) {
    console.error('[PDF] Failed to embed Amiri font:', error);
    throw error;
  }
};

/**
 * Setup PDF for a specific language
 * - Both languages use Amiri (supports Arabic + Latin)
 * - Arabic enables RTL mode
 * - English uses standard LTR mode
 */
export const setupPdfLanguage = async (
  pdf: jsPDF, 
  language: 'en' | 'ar'
): Promise<{ isArabic: boolean }> => {
  const isArabic = language === 'ar';
  
  // Always use Amiri font (works for both Arabic and English)
  await embedAmiriFont(pdf);
  
  // Set text direction
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (pdf as any).setR2L?.(isArabic);
  
  return { isArabic };
};
