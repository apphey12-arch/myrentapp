import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatEGP } from './currency';
import { BookingStatus, UnitType, PaymentStatus, getUnitTypeEmoji } from '@/types/database';
import { Language } from '@/contexts/LanguageContext';

// Amiri font embedded as Base64 (subset for Arabic support)
// This is a minimal subset that supports Arabic numerals and common characters
const AMIRI_FONT_BASE64 = `AAEAAAAPAIAAAwBwT1MvMlYJXhkAAAD8AAAAVmNtYXDb+xEsAAABVAAAAUpjdnQgAAAAAAAAAsAAAAACZ2FzcP//AAMAAALEAAAACGdseWZ5`; // Placeholder - will load dynamically

// PDF text labels in both languages
const pdfLabels = {
  en: {
    title: 'Sunlight Village',
    subtitle: 'Booking Receipt',
    date: 'Date',
    tenantInfo: 'Tenant Information',
    name: 'Name',
    phone: 'Phone',
    status: 'Status',
    payment: 'Payment',
    propertyDetails: 'Property Details',
    unit: 'Unit',
    type: 'Type',
    description: 'Description',
    details: 'Details',
    checkIn: 'Check-in Date',
    checkOut: 'Check-out Date',
    duration: 'Duration',
    days: 'day(s)',
    pricing: 'Pricing',
    amount: 'Amount (EGP)',
    dailyRate: 'Daily Rate',
    baseAmount: 'Base Amount',
    housekeeping: 'Housekeeping',
    refundableDeposit: 'Refundable Deposit',
    totalRent: 'Total Rent',
    grandTotal: 'Grand Total',
    thanks: 'Thank you for choosing Sunlight Village!',
    reportTitle: 'Financial Report',
    generated: 'Generated',
    dateRange: 'Date Range',
    scope: 'Scope',
    totalRevenue: 'Total Revenue',
    totalExpenses: 'Total Expenses',
    netIncome: 'Net Income',
    totalBookings: 'Total Bookings',
    occupiedDays: 'Occupied Days',
    avgDailyRate: 'Avg. Daily Rate',
    tenant: 'Tenant',
    dates: 'Dates',
    depositNote: '* Deposit is refundable and not included in Total Rent',
    unitPerformance: 'Unit Performance Report',
    netProfit: 'Net Profit',
    page: 'Page',
    of: 'of',
  },
  ar: {
    title: 'صن لايت فيليج',
    subtitle: 'إيصال الحجز',
    date: 'التاريخ',
    tenantInfo: 'معلومات المستأجر',
    name: 'الاسم',
    phone: 'الهاتف',
    status: 'الحالة',
    payment: 'الدفع',
    propertyDetails: 'تفاصيل العقار',
    unit: 'الوحدة',
    type: 'النوع',
    description: 'الوصف',
    details: 'التفاصيل',
    checkIn: 'تاريخ الدخول',
    checkOut: 'تاريخ الخروج',
    duration: 'المدة',
    days: 'يوم',
    pricing: 'التسعير',
    amount: 'المبلغ (ج.م)',
    dailyRate: 'السعر اليومي',
    baseAmount: 'المبلغ الأساسي',
    housekeeping: 'التنظيف',
    refundableDeposit: 'التأمين (مسترد)',
    totalRent: 'إجمالي الإيجار',
    grandTotal: 'الإجمالي',
    thanks: 'شكراً لاختياركم صن لايت فيليج!',
    reportTitle: 'التقرير المالي',
    generated: 'تاريخ الإنشاء',
    dateRange: 'الفترة',
    scope: 'النطاق',
    totalRevenue: 'إجمالي الإيرادات',
    totalExpenses: 'إجمالي المصروفات',
    netIncome: 'صافي الدخل',
    totalBookings: 'إجمالي الحجوزات',
    occupiedDays: 'أيام الإشغال',
    avgDailyRate: 'متوسط السعر اليومي',
    tenant: 'المستأجر',
    dates: 'التواريخ',
    depositNote: '* التأمين مبلغ مسترد ولا يدخل ضمن إجمالي الإيجار',
    unitPerformance: 'تقرير أداء الوحدات',
    netProfit: 'صافي الربح',
    page: 'صفحة',
    of: 'من',
  },
};

// Load Arabic font dynamically
const loadArabicFont = async (): Promise<string> => {
  try {
    // Use Amiri font for better Arabic support
    const response = await fetch('https://fonts.gstatic.com/s/amiri/v27/J7aRnpd8CGxBHpUrtLMA7w.ttf');
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
    console.error('Failed to load Arabic font:', error);
    throw error;
  }
};

// Setup PDF with Arabic font
const setupPdfWithFont = async (pdf: jsPDF, isArabic: boolean): Promise<void> => {
  if (isArabic) {
    try {
      const fontBase64 = await loadArabicFont();
      pdf.addFileToVFS('Amiri-Regular.ttf', fontBase64);
      pdf.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
      pdf.setFont('Amiri');
    } catch (error) {
      console.error('Failed to setup Arabic font, falling back to default:', error);
      pdf.setFont('helvetica');
    }
  } else {
    pdf.setFont('helvetica');
  }
};

// Reverse Arabic text for RTL rendering in jsPDF
const processArabicText = (text: string, isArabic: boolean): string => {
  if (!isArabic) return text;
  // jsPDF doesn't handle RTL well, so we need to reverse the text order
  return text.split('').reverse().join('');
};

// Add header to PDF page
const addPdfHeader = (pdf: jsPDF, title: string, subtitle: string, isArabic: boolean) => {
  const pageWidth = pdf.internal.pageSize.getWidth();
  
  // Header background
  pdf.setFillColor(14, 116, 144); // Primary cyan
  pdf.rect(0, 0, pageWidth, 40, 'F');
  
  // Title
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(22);
  const titleText = isArabic ? processArabicText(title, true) : title;
  pdf.text(titleText, pageWidth / 2, 18, { align: 'center' });
  
  // Subtitle
  pdf.setFontSize(12);
  const subtitleText = isArabic ? processArabicText(subtitle, true) : subtitle;
  pdf.text(subtitleText, pageWidth / 2, 30, { align: 'center' });
  
  pdf.setTextColor(0, 0, 0);
};

// Add page number footer
const addPageNumber = (pdf: jsPDF, currentPage: number, totalPages: number, labels: typeof pdfLabels.en) => {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  pdf.setFontSize(10);
  pdf.setTextColor(128, 128, 128);
  pdf.text(`${labels.page} ${currentPage} ${labels.of} ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
};

interface BookingReceiptData {
  tenantName: string;
  phoneNumber?: string | null;
  unitName: string;
  unitType: UnitType;
  startDate: string;
  endDate: string;
  durationDays: number;
  dailyRate: number;
  depositAmount?: number;
  housekeepingAmount?: number;
  totalAmount: number;
  status: BookingStatus;
  paymentStatus?: PaymentStatus;
  depositPaid: boolean;
}

export const generateBookingPDF = async (data: BookingReceiptData, language: Language = 'en') => {
  const labels = pdfLabels[language];
  const isArabic = language === 'ar';
  
  const baseAmount = data.dailyRate * data.durationDays;
  const housekeepingAmount = data.housekeepingAmount || 0;
  const totalRent = baseAmount + housekeepingAmount;
  
  const pdf = new jsPDF('p', 'mm', 'a4');
  await setupPdfWithFont(pdf, isArabic);
  
  const pageWidth = pdf.internal.pageSize.getWidth();
  
  // Header
  addPdfHeader(pdf, labels.title, labels.subtitle, isArabic);
  
  // Date
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  const dateText = `${labels.date}: ${new Date().toLocaleDateString(isArabic ? 'ar-EG' : 'en-US')}`;
  pdf.text(dateText, pageWidth / 2, 50, { align: 'center' });
  
  let yPos = 60;
  
  // Tenant Info Section
  pdf.setFontSize(14);
  pdf.setTextColor(14, 116, 144);
  pdf.text(isArabic ? processArabicText(labels.tenantInfo, true) : labels.tenantInfo, isArabic ? pageWidth - 15 : 15, yPos);
  yPos += 5;
  
  pdf.setDrawColor(14, 116, 144);
  pdf.setLineWidth(0.5);
  pdf.line(15, yPos, pageWidth - 15, yPos);
  yPos += 10;
  
  // Tenant details table
  autoTable(pdf, {
    startY: yPos,
    head: [],
    body: [
      [labels.name, data.tenantName],
      [labels.phone, data.phoneNumber || 'N/A'],
      [labels.status, data.status],
      [labels.payment, data.paymentStatus || 'Pending'],
    ],
    theme: 'plain',
    styles: {
      fontSize: 11,
      cellPadding: 4,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50, textColor: [100, 100, 100] },
      1: { cellWidth: 'auto' },
    },
    margin: { left: 15, right: 15 },
  });
  
  yPos = (pdf as any).lastAutoTable.finalY + 15;
  
  // Property Details Section
  pdf.setFontSize(14);
  pdf.setTextColor(14, 116, 144);
  pdf.text(isArabic ? processArabicText(labels.propertyDetails, true) : labels.propertyDetails, isArabic ? pageWidth - 15 : 15, yPos);
  yPos += 5;
  
  pdf.line(15, yPos, pageWidth - 15, yPos);
  yPos += 10;
  
  autoTable(pdf, {
    startY: yPos,
    head: [],
    body: [
      [labels.unit, `${getUnitTypeEmoji(data.unitType)} ${data.unitName}`],
      [labels.type, data.unitType],
      [labels.checkIn, data.startDate],
      [labels.checkOut, data.endDate],
      [labels.duration, `${data.durationDays} ${labels.days}`],
    ],
    theme: 'plain',
    styles: {
      fontSize: 11,
      cellPadding: 4,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50, textColor: [100, 100, 100] },
      1: { cellWidth: 'auto' },
    },
    margin: { left: 15, right: 15 },
  });
  
  yPos = (pdf as any).lastAutoTable.finalY + 15;
  
  // Pricing Section
  pdf.setFontSize(14);
  pdf.setTextColor(14, 116, 144);
  pdf.text(isArabic ? processArabicText(labels.pricing, true) : labels.pricing, isArabic ? pageWidth - 15 : 15, yPos);
  yPos += 5;
  
  pdf.line(15, yPos, pageWidth - 15, yPos);
  yPos += 10;
  
  const pricingData: (string | number)[][] = [
    [labels.description, labels.amount],
    [`${labels.dailyRate} × ${data.durationDays} ${labels.days}`, formatEGP(baseAmount)],
  ];
  
  if (housekeepingAmount > 0) {
    pricingData.push([labels.housekeeping, formatEGP(housekeepingAmount)]);
  }
  
  pricingData.push([labels.totalRent, formatEGP(totalRent)]);
  
  if (data.depositAmount && data.depositAmount > 0) {
    pricingData.push([`${labels.refundableDeposit} *`, formatEGP(data.depositAmount)]);
  }
  
  autoTable(pdf, {
    startY: yPos,
    head: [[labels.description, labels.amount]],
    body: pricingData.slice(1),
    theme: 'striped',
    styles: {
      fontSize: 11,
      cellPadding: 5,
    },
    headStyles: {
      fillColor: [14, 116, 144],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 50, halign: 'right' },
    },
    margin: { left: 15, right: 15 },
    didParseCell: (data) => {
      // Highlight total row
      if (data.row.index === pricingData.length - 3 || 
          (data.row.raw && (data.row.raw as string[])[0]?.includes(labels.totalRent))) {
        data.cell.styles.fillColor = [254, 243, 199];
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = [146, 64, 14];
      }
      // Style deposit row
      if (data.row.raw && (data.row.raw as string[])[0]?.includes('*')) {
        data.cell.styles.fontStyle = 'italic';
        data.cell.styles.textColor = [100, 100, 100];
      }
    },
  });
  
  yPos = (pdf as any).lastAutoTable.finalY + 10;
  
  // Deposit note
  if (data.depositAmount && data.depositAmount > 0) {
    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
    pdf.text(labels.depositNote, 15, yPos);
    yPos += 15;
  }
  
  // Footer
  const pageHeight = pdf.internal.pageSize.getHeight();
  pdf.setDrawColor(200, 200, 200);
  pdf.line(15, pageHeight - 25, pageWidth - 15, pageHeight - 25);
  
  pdf.setFontSize(11);
  pdf.setTextColor(100, 100, 100);
  pdf.text(labels.thanks, pageWidth / 2, pageHeight - 15, { align: 'center' });
  
  pdf.save(`booking-receipt-${data.tenantName.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-') || 'booking'}.pdf`);
};

interface ReportData {
  dateRange: string;
  unitScope: string;
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  totalBookings: number;
  occupiedDays: number;
  averageDailyRate: number;
  bookings: {
    unitName: string;
    tenantName: string;
    dates: string;
    amount: number;
    status: string;
    paymentStatus: string;
  }[];
}

export const generateReportPDF = async (data: ReportData, language: Language = 'en') => {
  const labels = pdfLabels[language];
  const isArabic = language === 'ar';
  
  const pdf = new jsPDF('p', 'mm', 'a4');
  await setupPdfWithFont(pdf, isArabic);
  
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Header
  addPdfHeader(pdf, labels.title, labels.reportTitle, isArabic);
  
  // Date and filters
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  pdf.text(`${labels.generated}: ${new Date().toLocaleDateString(isArabic ? 'ar-EG' : 'en-US')}`, pageWidth / 2, 50, { align: 'center' });
  pdf.text(`${labels.dateRange}: ${data.dateRange} | ${labels.scope}: ${data.unitScope}`, pageWidth / 2, 57, { align: 'center' });
  
  let yPos = 70;
  
  // Summary Stats
  const statsData = [
    [labels.totalRevenue, formatEGP(data.totalRevenue)],
    [labels.totalBookings, data.totalBookings.toString()],
    [labels.occupiedDays, `${data.occupiedDays} ${labels.days}`],
    [labels.avgDailyRate, formatEGP(data.averageDailyRate)],
  ];
  
  autoTable(pdf, {
    startY: yPos,
    head: [],
    body: statsData,
    theme: 'plain',
    styles: {
      fontSize: 12,
      cellPadding: 6,
    },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [100, 100, 100] },
      1: { fontStyle: 'bold', halign: 'right', textColor: [14, 116, 144] },
    },
    margin: { left: 15, right: 15 },
  });
  
  yPos = (pdf as any).lastAutoTable.finalY + 15;
  
  // Bookings table with auto-pagination
  pdf.setFontSize(14);
  pdf.setTextColor(14, 116, 144);
  pdf.text(labels.totalBookings, 15, yPos);
  yPos += 8;
  
  autoTable(pdf, {
    startY: yPos,
    head: [[labels.unit, labels.tenant, labels.dates, labels.amount, labels.status, labels.payment]],
    body: data.bookings.map(b => [
      b.unitName,
      b.tenantName,
      b.dates,
      formatEGP(b.amount),
      b.status,
      b.paymentStatus,
    ]),
    theme: 'striped',
    styles: {
      fontSize: 9,
      cellPadding: 4,
    },
    headStyles: {
      fillColor: [14, 116, 144],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    margin: { left: 15, right: 15 },
    // Auto-pagination: this will automatically create new pages
    showHead: 'everyPage',
    didDrawPage: (data) => {
      // Add page number to each page
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        addPageNumber(pdf, i, pageCount, labels);
      }
    },
  });
  
  // Footer on last page
  const lastPage = pdf.getNumberOfPages();
  pdf.setPage(lastPage);
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  pdf.text('Sunlight Village Property Management System', pageWidth / 2, pageHeight - 20, { align: 'center' });
  
  pdf.save(`report-${data.dateRange.replace(/\s+/g, '-')}.pdf`);
};

// New: Unit Performance Report
export interface UnitPerformanceData {
  unitName: string;
  unitType: UnitType;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
}

export const generateUnitPerformancePDF = async (
  units: UnitPerformanceData[],
  dateRange: string,
  language: Language = 'en'
) => {
  const labels = pdfLabels[language];
  const isArabic = language === 'ar';
  
  const pdf = new jsPDF('p', 'mm', 'a4');
  await setupPdfWithFont(pdf, isArabic);
  
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Header
  addPdfHeader(pdf, labels.title, labels.unitPerformance, isArabic);
  
  // Date
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  pdf.text(`${labels.generated}: ${new Date().toLocaleDateString(isArabic ? 'ar-EG' : 'en-US')}`, pageWidth / 2, 50, { align: 'center' });
  pdf.text(`${labels.dateRange}: ${dateRange}`, pageWidth / 2, 57, { align: 'center' });
  
  let yPos = 70;
  
  // Calculate totals
  const totalRevenue = units.reduce((sum, u) => sum + u.totalRevenue, 0);
  const totalExpenses = units.reduce((sum, u) => sum + u.totalExpenses, 0);
  const totalNetProfit = totalRevenue - totalExpenses;
  
  // Summary
  autoTable(pdf, {
    startY: yPos,
    head: [],
    body: [
      [labels.totalRevenue, formatEGP(totalRevenue)],
      [labels.totalExpenses, formatEGP(totalExpenses)],
      [labels.netProfit, formatEGP(totalNetProfit)],
    ],
    theme: 'plain',
    styles: {
      fontSize: 12,
      cellPadding: 6,
    },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [100, 100, 100] },
      1: { fontStyle: 'bold', halign: 'right' },
    },
    margin: { left: 15, right: 15 },
    didParseCell: (data) => {
      if (data.row.index === 0) {
        data.cell.styles.textColor = [22, 163, 74]; // Green for revenue
      } else if (data.row.index === 1) {
        data.cell.styles.textColor = [220, 38, 38]; // Red for expenses
      } else if (data.row.index === 2 && data.column.index === 1) {
        data.cell.styles.textColor = totalNetProfit >= 0 ? [22, 163, 74] : [220, 38, 38];
      }
    },
  });
  
  yPos = (pdf as any).lastAutoTable.finalY + 20;
  
  // Units performance table
  autoTable(pdf, {
    startY: yPos,
    head: [[labels.unit, labels.type, labels.totalRevenue, labels.totalExpenses, labels.netProfit]],
    body: units.map(u => [
      `${getUnitTypeEmoji(u.unitType)} ${u.unitName}`,
      u.unitType,
      formatEGP(u.totalRevenue),
      formatEGP(u.totalExpenses),
      formatEGP(u.netProfit),
    ]),
    theme: 'striped',
    styles: {
      fontSize: 10,
      cellPadding: 5,
    },
    headStyles: {
      fillColor: [14, 116, 144],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    margin: { left: 15, right: 15 },
    showHead: 'everyPage',
    didParseCell: (data) => {
      // Color net profit column
      if (data.column.index === 4 && data.section === 'body') {
        const unit = units[data.row.index];
        if (unit) {
          data.cell.styles.textColor = unit.netProfit >= 0 ? [22, 163, 74] : [220, 38, 38];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
  });
  
  // Page numbers
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    addPageNumber(pdf, i, pageCount, labels);
  }
  
  // Footer
  pdf.setPage(pageCount);
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  pdf.text('Sunlight Village Property Management System', pageWidth / 2, pageHeight - 20, { align: 'center' });
  
  pdf.save(`unit-performance-${dateRange.replace(/\s+/g, '-')}.pdf`);
};
