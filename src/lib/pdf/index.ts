// PDF Generation Service
// Clean jsPDF-based engine with Arabic support

export { 
  generateBookingReceipt, 
  generateFinancialReport,
  type UnitPerformanceData,
} from './pdf-service';

export { 
  type PdfLanguage,
  getTranslations,
  formatCurrency,
  formatDate,
} from './translations';

export { 
  fetchCairoFontBase64,
  isFontCached,
} from './font-loader';
