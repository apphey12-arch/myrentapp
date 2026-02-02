import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { registerCairoFont } from './font-loader';
import { BookingReceiptPdf } from './BookingReceiptPdf';
import { FinancialReportPdf } from './FinancialReportPdf';
import { Booking } from '@/types/database';

export type PdfLanguage = 'en' | 'ar';

interface UnitPerformanceData {
  unitName: string;
  unitType: string;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
}

/**
 * Generate and download a booking receipt PDF
 */
export const generateBookingReceipt = async (
  booking: Booking,
  language: PdfLanguage
): Promise<void> => {
  try {
    // Ensure Cairo font is registered
    await registerCairoFont();

    console.log('Generating booking receipt PDF...', { tenantName: booking.tenant_name, language });

    // Generate PDF blob
    const blob = await pdf(
      <BookingReceiptPdf booking={booking} language={language} />
    ).toBlob();

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Clean tenant name for filename
    const cleanName = booking.tenant_name.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_');
    link.download = `Receipt_${cleanName}_${booking.start_date}.pdf`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Cleanup
    URL.revokeObjectURL(url);
    
    console.log('Booking receipt PDF generated successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Layout Error: Failed to generate booking receipt PDF:', error);
    throw new Error(`Failed to generate PDF: ${message}`);
  }
};

/**
 * Generate and download a financial report PDF
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
    // Ensure Cairo font is registered
    await registerCairoFont();

    console.log('Generating financial report PDF...', { unitCount: data.length, language });

    // Generate PDF blob
    const blob = await pdf(
      <FinancialReportPdf data={data} totals={totals} language={language} />
    ).toBlob();

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const dateStr = new Date().toISOString().split('T')[0];
    link.download = `Financial_Report_${dateStr}.pdf`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Cleanup
    URL.revokeObjectURL(url);
    
    console.log('Financial report PDF generated successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Layout Error: Failed to generate financial report PDF:', error);
    throw new Error(`Failed to generate PDF: ${message}`);
  }
};
