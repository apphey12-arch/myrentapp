// Cairo Arabic font loader - fetches font at runtime to avoid large Base64 strings in code
// This prevents build failures from oversized source files

const CAIRO_FONT_URL = 'https://fonts.gstatic.com/s/cairo/v28/SLXgc1nY6HkvangtZmpcdU5f.ttf';

let cachedFontBase64: string | null = null;

/**
 * Fetches the Cairo font from Google Fonts CDN and converts to Base64
 * Caches result to avoid repeat fetches
 */
export const fetchArabicFontBase64 = async (): Promise<string> => {
  if (cachedFontBase64) {
    return cachedFontBase64;
  }

  try {
    const response = await fetch(CAIRO_FONT_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch Cairo font: ${response.status}`);
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
    console.error('Failed to load Cairo font:', error);
    throw error;
  }
};

// Backwards compatibility alias
export const fetchAmiriFontBase64 = fetchArabicFontBase64;

// For synchronous access after preloading
export let CAIRO_TTF_BASE64: string = '';

export const preloadCairoFont = async (): Promise<void> => {
  CAIRO_TTF_BASE64 = await fetchArabicFontBase64();
};
