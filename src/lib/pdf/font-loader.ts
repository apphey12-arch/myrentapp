import { Font } from '@react-pdf/renderer';

// Cairo font URLs from Google Fonts static files (reliable source)
const CAIRO_REGULAR_URL = 'https://fonts.gstatic.com/s/cairo/v28/SLXgc1nY6HkvangtZmpQdkhzfH5lkSs2SgRjCAGMQ1z0hOA-a13iKjM.ttf';
const CAIRO_BOLD_URL = 'https://fonts.gstatic.com/s/cairo/v28/SLXgc1nY6HkvangtZmpQdkhzfH5lkSs2SgRjCAGMQ1z0hL4-a13iKjM.ttf';

let fontRegistered = false;
let fontError: string | null = null;

/**
 * Register Cairo font for PDF generation
 * This must be called before rendering any PDF documents
 */
export const registerCairoFont = async (): Promise<void> => {
  if (fontRegistered) return;
  if (fontError) throw new Error(fontError);

  try {
    // Register Cairo font family with regular and bold weights
    Font.register({
      family: 'Cairo',
      fonts: [
        {
          src: CAIRO_REGULAR_URL,
          fontWeight: 'normal',
          fontStyle: 'normal',
        },
        {
          src: CAIRO_BOLD_URL,
          fontWeight: 'bold',
          fontStyle: 'normal',
        },
      ],
    });

    // Disable hyphenation for Arabic text - critical for proper rendering
    Font.registerHyphenationCallback((word) => [word]);

    fontRegistered = true;
    console.log('Cairo font registered successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown font loading error';
    fontError = `Font Load Error: ${message}`;
    console.error('Failed to register Cairo font:', error);
    throw new Error(fontError);
  }
};

/**
 * Check if Cairo font is already registered
 */
export const isFontRegistered = (): boolean => fontRegistered;

/**
 * Get any font registration error
 */
export const getFontError = (): string | null => fontError;

/**
 * Reset font registration state (useful for testing)
 */
export const resetFontState = (): void => {
  fontRegistered = false;
  fontError = null;
};
