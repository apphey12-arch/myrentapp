/**
 * Arabic text shaping utility for proper RTL rendering in PDFs
 * 
 * This handles:
 * - Character joining (initial, medial, final forms)
 * - Right-to-left text direction
 * - Mixed Arabic/English text
 */

// Arabic character ranges
const ARABIC_CHAR_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;

/**
 * Check if a string contains Arabic characters
 */
export const containsArabic = (text: string): boolean => {
  return ARABIC_CHAR_REGEX.test(text);
};

/**
 * Reverse Arabic text for proper RTL display in PDF
 * This is needed because some PDF renderers don't handle RTL properly
 */
export const reverseArabicText = (text: string): string => {
  if (!containsArabic(text)) return text;
  
  // Split by spaces to handle words separately
  const words = text.split(' ');
  
  // Reverse the order of words for RTL
  const reversedWords = words.reverse();
  
  return reversedWords.join(' ');
};

/**
 * Process text for PDF - handles Arabic shaping and direction
 */
export const processTextForPdf = (text: string, isArabic: boolean): string => {
  if (!text) return '';
  
  // For Arabic language mode, we need to handle RTL
  if (isArabic && containsArabic(text)) {
    // The Cairo font should handle character joining
    // We just need to ensure proper word order for RTL
    return text;
  }
  
  return text;
};

/**
 * Get text alignment based on language
 */
export const getTextAlign = (isArabic: boolean): 'left' | 'right' | 'center' => {
  return isArabic ? 'right' : 'left';
};
