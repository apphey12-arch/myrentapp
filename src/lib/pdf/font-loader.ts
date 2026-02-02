/**
 * Cairo Font Loader for jsPDF
 * Runtime-fetch Cairo TTFs (regular + bold) and convert to Base64 for jsPDF VFS.
 *
 * CRITICAL: We do NOT hardcode base64 in repo (prevents build issues).
 */

// User-specified runtime source
const CAIRO_REGULAR_URL =
  'https://raw.githubusercontent.com/googlefonts/cairo/main/fonts/ttf/Cairo-Regular.ttf';
const CAIRO_BOLD_URL =
  'https://raw.githubusercontent.com/googlefonts/cairo/main/fonts/ttf/Cairo-Bold.ttf';

type CairoFontVariant = 'regular' | 'bold';

const cache: Partial<Record<CairoFontVariant, string>> = {};
let fontLoadError: string | null = null;
const inFlight: Partial<Record<CairoFontVariant, Promise<string>>> = {};

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
};

const fetchFontAsBase64 = async (url: string, label: string): Promise<string> => {
  const res = await fetch(url, { cache: 'force-cache' });
  if (!res.ok) {
    throw new Error(`${label} fetch failed: ${res.status} ${res.statusText}`);
  }
  const buf = await res.arrayBuffer();
  return arrayBufferToBase64(buf);
};

/**
 * Fetch Cairo font (regular/bold) and convert to Base64.
 * Caches the result for subsequent calls.
 */
export const fetchCairoFontBase64 = async (variant: CairoFontVariant = 'regular'): Promise<string> => {
  if (cache[variant]) return cache[variant]!;
  if (fontLoadError) throw new Error(fontLoadError);
  if (inFlight[variant]) return inFlight[variant]!;

  const url = variant === 'bold' ? CAIRO_BOLD_URL : CAIRO_REGULAR_URL;
  const label = variant === 'bold' ? 'Cairo Bold' : 'Cairo Regular';

  inFlight[variant] = (async () => {
    try {
      console.log(`[PDF] Fetching ${label} font...`, url);
      const base64 = await fetchFontAsBase64(url, label);
      cache[variant] = base64;
      console.log(`[PDF] ${label} font loaded OK (base64 length=${base64.length})`);
      return base64;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown font loading error';
      fontLoadError = `Font Load Error: ${message}`;
      console.error('[PDF] Font Load Error:', error);
      throw new Error(fontLoadError);
    } finally {
      delete inFlight[variant];
    }
  })();

  return inFlight[variant]!;
};

/**
 * Check if font is already cached
 */
export const isFontCached = (): boolean => Boolean(cache.regular);

/**
 * Reset font cache (useful for testing)
 */
export const resetFontCache = (): void => {
  delete cache.regular;
  delete cache.bold;
  fontLoadError = null;
  delete inFlight.regular;
  delete inFlight.bold;
};
