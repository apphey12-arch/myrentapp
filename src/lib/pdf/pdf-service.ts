import type { Booking } from '@/types/database';
import type { PdfLanguage } from './translations';

import type { UnitPerformanceData } from './types';

import { renderElementToPdf } from './dom/pdf-utils';
import { buildBookingReceiptElement } from './dom/receipt-template';
import { buildFinancialReportElement } from './dom/report-template';
import { buildBookingsReportElement, BookingsReportOptions } from './dom/bookings-report-template';

/**
 * Generate Booking Receipt PDF
 */
export const generateBookingReceipt = async (
  booking: Booking,
  language: PdfLanguage
): Promise<void> => {
  try {
    console.log('[PDF][DOM] Generating booking receipt...', { tenant: booking.tenant_name, language });

    const el = buildBookingReceiptElement(booking, language);
    const cleanName = booking.tenant_name.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_');
    const filename = `Receipt_${cleanName}_${booking.start_date}.pdf`;

    await renderElementToPdf({ element: el, filename, language });

    console.log('[PDF][DOM] Booking receipt generated successfully');
  } catch (error) {
    console.error('[PDF][DOM] Failed to generate booking receipt (EXACT ERROR):', error);
    throw error;
  }
};

export type { UnitPerformanceData } from './types';

/**
 * Generate Financial Report PDF
 */
export const generateFinancialReport = async (
  data: UnitPerformanceData[],
  totals: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
  },
  language: PdfLanguage
): Promise<void> => {
  try {
    console.log('[PDF][DOM] Generating financial report...', { unitCount: data.length, language });

    const el = buildFinancialReportElement({ data, totals, language });
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `Financial_Report_${dateStr}.pdf`;

    await renderElementToPdf({ element: el, filename, language });

    console.log('[PDF][DOM] Financial report generated successfully');
  } catch (error) {
    console.error('[PDF][DOM] Failed to generate financial report (EXACT ERROR):', error);
    throw error;
  }
};

/**
 * Generate Detailed Bookings Report PDF (for Reports page)
 */
export const generateBookingsReport = async (
  options: BookingsReportOptions
): Promise<void> => {
  try {
    console.log('[PDF][DOM] Generating bookings report...', { 
      bookingCount: options.bookings.length, 
      language: options.language 
    });

    const el = buildBookingsReportElement(options);
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `Bookings_Report_${dateStr}.pdf`;

    await renderElementToPdf({ element: el, filename, language: options.language });

    console.log('[PDF][DOM] Bookings report generated successfully');
  } catch (error) {
    console.error('[PDF][DOM] Failed to generate bookings report (EXACT ERROR):', error);
    throw error;
  }
};
