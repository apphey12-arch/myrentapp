// Amiri font loader - fetches font at runtime to avoid large Base64 strings in code
// This prevents build failures from oversized source files

const AMIRI_FONT_URL = 'https://cdn.jsdelivr.net/gh/aliftype/amiri@1.000/Amiri-Regular.ttf';

let cachedFontBase64: string | null = null;

/**
 * Fetches the Amiri font from CDN and converts to Base64
 * Caches result to avoid repeat fetches
 */
export const fetchAmiriFontBase64 = async (): Promise<string> => {
  if (cachedFontBase64) {
    return cachedFontBase64;
  }

  try {
    const response = await fetch(AMIRI_FONT_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch Amiri font: ${response.status}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    
    // Convert ArrayBuffer to Base64
    const uint8Array = new Uint8Array(arrayBuffer);
    let binaryString = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binaryString += String.fromCharCode(uint8Array[i]);
    }
    const base64 = btoa(binaryString);
    
    cachedFontBase64 = base64;
    return base64;
  } catch (error) {
    console.error('Failed to load Amiri font:', error);
    throw error;
  }
};

// For synchronous access after preloading
export let AMIRI_TTF_BASE64: string = '';

export const preloadAmiriFont = async (): Promise<void> => {
  AMIRI_TTF_BASE64 = await fetchAmiriFontBase64();
};
