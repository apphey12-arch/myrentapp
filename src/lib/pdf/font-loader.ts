/**
 * Cairo Font Loader for jsPDF
 * Fetches Cairo font from Google Fonts and converts to Base64 for VFS
 */

// Cairo font URL - Regular weight from Google Fonts
const CAIRO_FONT_URL = 'https://fonts.gstatic.com/s/cairo/v28/SLXgc1nY6HkvangtZmpQdkhzfH5lkSs2SgRjCAGMQ1z0hOA-a13iKjM.ttf';

let cachedFontBase64: string | null = null;
let fontLoadError: string | null = null;
let isLoading = false;

/**
 * Fetch Cairo font and convert to Base64
 * Caches the result for subsequent calls
 */
export const fetchCairoFontBase64 = async (): Promise<string> => {
  // Return cached font if available
  if (cachedFontBase64) {
    return cachedFontBase64;
  }

  // If there was a previous error, throw it
  if (fontLoadError) {
    throw new Error(fontLoadError);
  }

  // Prevent concurrent fetches
  if (isLoading) {
    // Wait for the current fetch to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    return fetchCairoFontBase64();
  }

  isLoading = true;

  try {
    console.log('Fetching Cairo font from Google Fonts...');
    
    const response = await fetch(CAIRO_FONT_URL);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch font: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Convert to Base64
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    
    cachedFontBase64 = btoa(binary);
    console.log('Cairo font loaded successfully, size:', cachedFontBase64.length);
    
    return cachedFontBase64;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown font loading error';
    fontLoadError = `Font Load Error: ${message}`;
    console.error('Failed to load Cairo font:', error);
    throw new Error(fontLoadError);
  } finally {
    isLoading = false;
  }
};

/**
 * Check if font is already cached
 */
export const isFontCached = (): boolean => cachedFontBase64 !== null;

/**
 * Reset font cache (useful for testing)
 */
export const resetFontCache = (): void => {
  cachedFontBase64 = null;
  fontLoadError = null;
  isLoading = false;
};
