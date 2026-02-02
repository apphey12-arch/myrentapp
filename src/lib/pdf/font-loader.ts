import { Font } from '@react-pdf/renderer';

// Cairo font URL from Google Fonts static files (reliable source)
const CAIRO_FONT_URL = 'https://fonts.gstatic.com/s/cairo/v28/SLXgc1nY6HkvangtZmpQdkhzfH5lkSs2SgRjCAGMQ1z0hOA-a13iKjM.ttf';

let fontRegistered = false;

/**
 * Register Cairo font for PDF generation
 * This must be called before rendering any PDF documents
 */
export const registerCairoFont = async (): Promise<void> => {
  if (fontRegistered) return;

  try {
    Font.register({
      family: 'Cairo',
      fonts: [
        {
          src: CAIRO_FONT_URL,
          fontWeight: 'normal',
        },
      ],
    });

    fontRegistered = true;
    console.log('Cairo font registered successfully');
  } catch (error) {
    console.error('Failed to register Cairo font:', error);
    throw new Error('Failed to load Arabic font. Please try again.');
  }
};

/**
 * Check if Cairo font is already registered
 */
export const isFontRegistered = (): boolean => fontRegistered;
