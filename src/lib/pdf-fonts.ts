// Cairo Arabic font loader for jsPDF
// Fetches and converts the Cairo font to Base64 for PDF embedding

const CAIRO_FONT_URL = 'https://fonts.gstatic.com/s/cairo/v28/SLXgc1nY6HkvangtZmpcWmhzfH5lWWgcQyyS4J0.woff2';

let cachedFontBase64: string | null = null;

export const loadCairoFont = async (): Promise<string> => {
  if (cachedFontBase64) {
    return cachedFontBase64;
  }

  try {
    // Fetch the font file
    const response = await fetch(CAIRO_FONT_URL);
    const blob = await response.blob();
    
    // Convert to Base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        cachedFontBase64 = base64;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Failed to load Cairo font:', error);
    throw error;
  }
};

// Alternative: Use Amiri font which has better Arabic support
const AMIRI_FONT_URL = 'https://fonts.gstatic.com/s/amiri/v27/J7aRnpd8CGxBHpUrtLMA7w.ttf';

export const loadAmiriFont = async (): Promise<string> => {
  try {
    const response = await fetch(AMIRI_FONT_URL);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Failed to load Amiri font:', error);
    throw error;
  }
};
