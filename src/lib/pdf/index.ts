// PDF Generation Service
// DOM-to-PDF pipeline with Arabic support

export { 
  generateBookingReceipt, 
  generateFinancialReport,
  generateBookingsReport,
  type UnitPerformanceData,
} from './pdf-service';

export { 
  type PdfLanguage,
  getTranslations,
  formatCurrency,
  formatDate,
} from './translations';

export type { BookingsReportOptions } from './dom/bookings-report-template';
