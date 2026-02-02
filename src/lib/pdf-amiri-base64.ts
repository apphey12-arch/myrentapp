// Cairo Arabic font loader - fetches font at runtime.
// IMPORTANT: We do NOT embed a giant Base64 string in the repo (it breaks builds).
// Instead we fetch the TTF and pass it to jsPDF as a *binary string* in-memory.

// User-provided Google Fonts URL (TTF)
const CAIRO_FONT_URL = 'https://fonts.gstatic.com/s/cairo/v20/SLXGc1nY6HkvangtZmpcMw.ttf';

let cachedFontBinary: string | null = null;

const arrayBufferToBinaryString = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000; // avoid call stack limits
  let out = '';

  for (let i = 0; i < bytes.length; i += chunkSize) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    out += String.fromCharCode(...(bytes.subarray(i, i + chunkSize) as any));
  }

  return out;
};

/**
 * Fetches the Cairo TTF from Google Fonts and returns a binary string
 * (jsPDF expects font file content as a binary string in addFileToVFS).
 * Caches result to avoid repeat fetches.
 */
export const fetchArabicFontBase64 = async (): Promise<string> => {
  if (cachedFontBinary) {
    return cachedFontBinary;
  }

  try {
    const response = await fetch(CAIRO_FONT_URL, { mode: 'cors' });
    if (!response.ok) {
      throw new Error(`Failed to fetch Cairo font: ${response.status}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();

    const binary = arrayBufferToBinaryString(arrayBuffer);
    cachedFontBinary = binary;
    return binary;
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
