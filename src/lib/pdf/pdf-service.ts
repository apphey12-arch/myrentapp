import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { fetchCairoFontBase64 } from './font-loader';
import { getTranslations, formatCurrency, formatDate, type PdfLanguage } from './translations';
import type { Booking } from '@/types/database';
import { shapeText } from './arabic';

// Lessor contact information
const LESSOR_INFO = {
  whatsApp: '+20 100 123 4567',
  instaPay: 'sunlight.village',
};

const setRtl = (doc: jsPDF, enabled: boolean) => {
  const anyDoc = doc as any;
  // User asked for setRTL(true), but some jsPDF builds expose setR2L(true).
  if (typeof anyDoc.setRTL === 'function') anyDoc.setRTL(enabled);
  if (typeof anyDoc.setR2L === 'function') anyDoc.setR2L(enabled);
  if (typeof anyDoc.setLanguage === 'function') anyDoc.setLanguage(enabled ? 'ar' : 'en');
};

const tr = (language: PdfLanguage) => (text: string) => shapeText(text, language);

/**
 * Setup jsPDF document with Cairo font for Arabic support
 */
const setupDocument = async (language: PdfLanguage): Promise<jsPDF> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Load and register Cairo fonts (runtime fetch)
  const cairoRegular = await fetchCairoFontBase64('regular');
  doc.addFileToVFS('Cairo-Regular.ttf', cairoRegular);
  doc.addFont('Cairo-Regular.ttf', 'Cairo', 'normal');

  // Bold variant (fallback to regular if bold fetch fails)
  try {
    const cairoBold = await fetchCairoFontBase64('bold');
    doc.addFileToVFS('Cairo-Bold.ttf', cairoBold);
    doc.addFont('Cairo-Bold.ttf', 'Cairo', 'bold');
  } catch (e) {
    console.warn('[PDF] Cairo Bold failed to load; using regular for bold.', e);
    doc.addFileToVFS('Cairo-Bold.ttf', cairoRegular);
    doc.addFont('Cairo-Bold.ttf', 'Cairo', 'bold');
  }

  // Language-specific defaults
  if (language === 'ar') {
    setRtl(doc, true);
    doc.setFont('Cairo', 'normal');
  } else {
    setRtl(doc, false);
    doc.setFont('helvetica', 'normal');
  }

  return doc;
};

/**
 * Add header to PDF
 */
const addHeader = (doc: jsPDF, title: string, subtitle: string, isRtl: boolean, language: PdfLanguage): number => {
  const tText = tr(language);
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Brand name
  doc.setFontSize(24);
  doc.setTextColor(12, 74, 110); // primary dark blue
  doc.text(tText(title), pageWidth / 2, 25, { align: 'center' });
  
  // Subtitle
  doc.setFontSize(14);
  doc.setTextColor(100, 116, 139); // muted gray
  doc.text(tText(subtitle), pageWidth / 2, 35, { align: 'center' });
  
  // Header line
  doc.setDrawColor(14, 165, 233); // primary blue
  doc.setLineWidth(0.5);
  doc.line(20, 42, pageWidth - 20, 42);
  
  return 50; // Return Y position after header
};

/**
 * Add footer to PDF
 */
const addFooter = (doc: jsPDF, t: ReturnType<typeof getTranslations>, language: PdfLanguage): void => {
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const tText = tr(language);
  
  // Footer line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(20, pageHeight - 30, pageWidth - 20, pageHeight - 30);
  
  // Thank you message
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(tText(t.thankYou), pageWidth / 2, pageHeight - 22, { align: 'center' });
  
  // Generated date
  const dateStr = new Date().toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US');
  doc.setFontSize(8);
  doc.text(tText(`${t.generatedOn}: ${dateStr}`), pageWidth / 2, pageHeight - 15, { align: 'center' });
};

/**
 * Generate Booking Receipt PDF
 */
export const generateBookingReceipt = async (
  booking: Booking,
  language: PdfLanguage
): Promise<void> => {
  try {
    console.log('[PDF] Generating booking receipt...', { tenant: booking.tenant_name, language });
    
    const doc = await setupDocument(language);
    const t = getTranslations(language);
    const isRtl = language === 'ar';
    const tText = tr(language);
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Add header
    let yPos = addHeader(doc, t.brandName, t.bookingReceipt, isRtl, language);
    
    // Calculate financials
    const baseRent = booking.daily_rate * booking.duration_days;
    const housekeeping = booking.housekeeping_amount || 0;
    const grandTotal = baseRent + housekeeping;
    const deposit = booking.deposit_amount || 0;
    
    // Tenant Information Table
    doc.setFontSize(12);
    doc.setTextColor(12, 74, 110);
    doc.text(tText(t.tenantInformation), isRtl ? pageWidth - 20 : 20, yPos, { align: isRtl ? 'right' : 'left' });
    yPos += 5;
    
    autoTable(doc, {
      startY: yPos,
      head: [],
      body: [
        [tText(t.tenantName), tText(booking.tenant_name)],
        ...(booking.phone_number ? [[tText(t.phoneNumber), tText(booking.phone_number)]] : []),
      ],
      theme: 'plain',
      styles: {
        font: language === 'ar' ? 'Cairo' : 'helvetica',
        fontSize: 10,
        cellPadding: 4,
        halign: isRtl ? 'right' : 'left',
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50, textColor: [100, 116, 139] },
        1: { cellWidth: 'auto', textColor: [30, 41, 59] },
      },
      margin: { left: 20, right: 20 },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 10;
    
    // Property Details Table
    doc.setFontSize(12);
    doc.setTextColor(12, 74, 110);
    doc.text(tText(t.propertyDetails), isRtl ? pageWidth - 20 : 20, yPos, { align: isRtl ? 'right' : 'left' });
    yPos += 5;
    
    autoTable(doc, {
      startY: yPos,
      head: [],
      body: [
        [tText(t.unit), tText(booking.unit?.name || 'N/A')],
        [tText(t.unitType), tText(booking.unit?.type || 'N/A')],
      ],
      theme: 'plain',
      styles: {
        font: language === 'ar' ? 'Cairo' : 'helvetica',
        fontSize: 10,
        cellPadding: 4,
        halign: isRtl ? 'right' : 'left',
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50, textColor: [100, 116, 139] },
        1: { cellWidth: 'auto', textColor: [30, 41, 59] },
      },
      margin: { left: 20, right: 20 },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 10;
    
    // Booking Dates Table
    doc.setFontSize(12);
    doc.setTextColor(12, 74, 110);
    doc.text(tText(t.bookingDates), isRtl ? pageWidth - 20 : 20, yPos, { align: isRtl ? 'right' : 'left' });
    yPos += 5;
    
    autoTable(doc, {
      startY: yPos,
      head: [],
      body: [
        [tText(t.checkIn), tText(formatDate(booking.start_date, language))],
        [tText(t.checkOut), tText(formatDate(booking.end_date, language))],
        [tText(t.duration), tText(`${booking.duration_days} ${t.days}`)],
      ],
      theme: 'plain',
      styles: {
        font: language === 'ar' ? 'Cairo' : 'helvetica',
        fontSize: 10,
        cellPadding: 4,
        halign: isRtl ? 'right' : 'left',
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50, textColor: [100, 116, 139] },
        1: { cellWidth: 'auto', textColor: [30, 41, 59] },
      },
      margin: { left: 20, right: 20 },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 10;
    
    // Financial Breakdown Table
    doc.setFontSize(12);
    doc.setTextColor(12, 74, 110);
    doc.text(tText(t.financialBreakdown), isRtl ? pageWidth - 20 : 20, yPos, { align: isRtl ? 'right' : 'left' });
    yPos += 5;
    
    const financialRows: string[][] = [
      [tText(t.dailyRate), tText(formatCurrency(booking.daily_rate))],
      [tText(`${t.baseRent} (${booking.duration_days} ${t.days})`), tText(formatCurrency(baseRent))],
    ];
    
    if (housekeeping > 0) {
      financialRows.push([tText(t.housekeeping), tText(formatCurrency(housekeeping))]);
    }
    
    autoTable(doc, {
      startY: yPos,
      head: [],
      body: financialRows,
      theme: 'striped',
      styles: {
        font: language === 'ar' ? 'Cairo' : 'helvetica',
        fontSize: 10,
        cellPadding: 5,
        halign: isRtl ? 'right' : 'left',
      },
      columnStyles: {
        0: { cellWidth: 100, textColor: [100, 116, 139] },
        1: { cellWidth: 'auto', fontStyle: 'bold', textColor: [30, 41, 59] },
      },
      margin: { left: 20, right: 20 },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 5;
    
    // Grand Total Box
    doc.setFillColor(14, 165, 233); // primary blue
    doc.roundedRect(20, yPos, pageWidth - 40, 15, 2, 2, 'F');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text(tText(t.grandTotal), isRtl ? pageWidth - 30 : 30, yPos + 10, { align: isRtl ? 'right' : 'left' });
    doc.text(tText(formatCurrency(grandTotal)), isRtl ? 30 : pageWidth - 30, yPos + 10, { align: isRtl ? 'left' : 'right' });
    
    yPos += 25;
    
    // Security Deposit (if any)
    if (deposit > 0) {
      doc.setFillColor(254, 243, 199); // warning yellow bg
      doc.setDrawColor(252, 211, 77); // warning yellow border
      doc.setLineWidth(0.5);
      doc.roundedRect(20, yPos, pageWidth - 40, 12, 2, 2, 'FD');
      doc.setFontSize(10);
      doc.setTextColor(146, 64, 14); // warning text
      doc.text(tText(`${t.securityDeposit} ${t.refundable}`), isRtl ? pageWidth - 30 : 30, yPos + 8, { align: isRtl ? 'right' : 'left' });
      doc.text(tText(formatCurrency(deposit)), isRtl ? 30 : pageWidth - 30, yPos + 8, { align: isRtl ? 'left' : 'right' });
      yPos += 20;
    }
    
    // Status
    yPos += 5;
    autoTable(doc, {
      startY: yPos,
      head: [],
      body: [
        [tText(t.status), tText(booking.status)],
        [tText(t.paymentStatus), tText(booking.payment_status)],
      ],
      theme: 'plain',
      styles: {
        font: language === 'ar' ? 'Cairo' : 'helvetica',
        fontSize: 10,
        cellPadding: 4,
        halign: isRtl ? 'right' : 'left',
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50, textColor: [100, 116, 139] },
        1: { cellWidth: 'auto', textColor: [30, 41, 59] },
      },
      margin: { left: 20, right: 20 },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 15;
    
    // Payment Instructions
    doc.setFontSize(11);
    doc.setTextColor(12, 74, 110);
    doc.text(tText(t.paymentInstructions), isRtl ? pageWidth - 20 : 20, yPos, { align: isRtl ? 'right' : 'left' });
    yPos += 5;
    
    autoTable(doc, {
      startY: yPos,
      head: [],
      body: [
        [tText(t.whatsApp), tText(LESSOR_INFO.whatsApp)],
        [tText(t.instaPay), tText(LESSOR_INFO.instaPay)],
      ],
      theme: 'plain',
      styles: {
        font: language === 'ar' ? 'Cairo' : 'helvetica',
        fontSize: 10,
        cellPadding: 4,
        halign: isRtl ? 'right' : 'left',
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50, textColor: [100, 116, 139] },
        1: { cellWidth: 'auto', textColor: [30, 41, 59] },
      },
      margin: { left: 20, right: 20 },
    });
    
    // Add footer
    addFooter(doc, t, language);
    
    // Save PDF
    const cleanName = booking.tenant_name.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_');
    doc.save(`Receipt_${cleanName}_${booking.start_date}.pdf`);
    
    console.log('[PDF] Booking receipt generated successfully');
  } catch (error) {
    console.error('[PDF] Layout Error: Failed to generate booking receipt:', error);
    throw error;
  }
};

/**
 * Unit performance data for financial report
 */
export interface UnitPerformanceData {
  unitName: string;
  unitType: string;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
}

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
    console.log('[PDF] Generating financial report...', { unitCount: data.length, language });
    
    const doc = await setupDocument(language);
    const t = getTranslations(language);
    const isRtl = language === 'ar';
    const tText = tr(language);
    
    // Add header
    let yPos = addHeader(doc, t.brandName, t.unitPerformanceReport, isRtl, language);
    
    // Prepare table data
    // EXACT requested columns: Unit Name | Total Revenue | Expenses | Net Profit
    const tableHead = [[tText(t.unitName), tText(t.totalRevenue), tText(t.expenses), tText(t.netProfit)]];
    const tableBody = data.map((unit) => [
      tText(unit.unitName),
      tText(formatCurrency(unit.totalRevenue)),
      tText(formatCurrency(unit.totalExpenses)),
      tText((unit.netProfit >= 0 ? '+' : '') + formatCurrency(unit.netProfit)),
    ]);
    
    // Add totals row
    tableBody.push([
      tText(t.total),
      tText(formatCurrency(totals.totalRevenue)),
      tText(formatCurrency(totals.totalExpenses)),
      tText((totals.netProfit >= 0 ? '+' : '') + formatCurrency(totals.netProfit)),
    ]);
    
    // Create table with autotable
    autoTable(doc, {
      startY: yPos,
      head: tableHead,
      body: tableBody,
      theme: 'striped',
      styles: {
        font: language === 'ar' ? 'Cairo' : 'helvetica',
        fontSize: 10,
        cellPadding: 5,
        halign: 'center',
        valign: 'middle',
      },
      headStyles: {
        fillColor: [14, 165, 233],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 11,
      },
      bodyStyles: {
        textColor: [30, 41, 59],
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { halign: isRtl ? 'right' : 'left' },
        1: { textColor: [22, 163, 74] }, // revenue
        2: { textColor: [220, 38, 38] }, // expenses
        3: { fontStyle: 'bold' }, // net profit (color set per cell)
      },
      margin: { left: 20, right: 20 },
      didParseCell: (data) => {
        // Style the totals row
        if (data.row.index === tableBody.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [224, 242, 254];
        }
        
        // Color net profit column based on sign
        if (data.column.index === 3 && data.section === 'body') {
          const cellText = String(data.cell.raw || '');
          data.cell.styles.textColor = cellText.trim().startsWith('-')
            ? [220, 38, 38]
            : [22, 163, 74];
        }
      },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 20;
    
    // Summary boxes
    const pageWidth = doc.internal.pageSize.getWidth();
    const boxWidth = (pageWidth - 60) / 3;
    
    // Revenue box
    doc.setFillColor(220, 252, 231); // green bg
    doc.roundedRect(20, yPos, boxWidth, 30, 2, 2, 'F');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(t.totalRevenue, 20 + boxWidth / 2, yPos + 10, { align: 'center' });
    doc.setFontSize(14);
    doc.setTextColor(22, 163, 74);
    doc.text(formatCurrency(totals.totalRevenue), 20 + boxWidth / 2, yPos + 22, { align: 'center' });
    
    // Expenses box
    doc.setFillColor(254, 226, 226); // red bg
    doc.roundedRect(30 + boxWidth, yPos, boxWidth, 30, 2, 2, 'F');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(t.expenses, 30 + boxWidth + boxWidth / 2, yPos + 10, { align: 'center' });
    doc.setFontSize(14);
    doc.setTextColor(220, 38, 38);
    doc.text(formatCurrency(totals.totalExpenses), 30 + boxWidth + boxWidth / 2, yPos + 22, { align: 'center' });
    
    // Net Profit box
    const profitBgColor = totals.netProfit >= 0 ? [220, 252, 231] : [254, 226, 226];
    const profitTextColor = totals.netProfit >= 0 ? [22, 163, 74] : [220, 38, 38];
    doc.setFillColor(profitBgColor[0], profitBgColor[1], profitBgColor[2]);
    doc.roundedRect(40 + boxWidth * 2, yPos, boxWidth, 30, 2, 2, 'F');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(t.netProfit, 40 + boxWidth * 2 + boxWidth / 2, yPos + 10, { align: 'center' });
    doc.setFontSize(14);
    doc.setTextColor(profitTextColor[0], profitTextColor[1], profitTextColor[2]);
    doc.text((totals.netProfit >= 0 ? '+' : '') + formatCurrency(totals.netProfit), 40 + boxWidth * 2 + boxWidth / 2, yPos + 22, { align: 'center' });
    
    // Add footer
    addFooter(doc, t, language);
    
    // Save PDF
    const dateStr = new Date().toISOString().split('T')[0];
    doc.save(`Financial_Report_${dateStr}.pdf`);
    
    console.log('[PDF] Financial report generated successfully');
  } catch (error) {
    console.error('[PDF] Layout Error: Failed to generate financial report:', error);
    throw error;
  }
};
