import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatEGP } from './currency';
import { BookingStatus, UnitType, PaymentStatus, getUnitTypeEmoji } from '@/types/database';

// Cairo font Base64 (subset for Arabic support)
// We'll use a simpler approach - generate text as Unicode
const setupArabicSupport = (doc: jsPDF) => {
  // For Arabic text, we need to reverse the string for RTL display
  // jsPDF doesn't natively support RTL, so we handle it manually
};

// Helper to check if text contains Arabic
const containsArabic = (text: string): boolean => {
  return /[\u0600-\u06FF]/.test(text);
};

// Process text for PDF - handle Arabic by reversing for display
const processText = (text: string): string => {
  if (containsArabic(text)) {
    // For Arabic text in PDF, we need special handling
    // Split by spaces, reverse each word, then reverse word order
    return text.split(' ').reverse().join(' ');
  }
  return text;
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

export const generateBookingPDF = (data: BookingReceiptData) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFillColor(14, 116, 144); // Ocean blue
  doc.rect(0, 0, 210, 45, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Sunlight Village', 20, 25);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Booking Receipt / إيصال الحجز', 20, 35);
  
  // Reset colors
  doc.setTextColor(0, 0, 0);
  
  // Receipt details
  doc.setFontSize(10);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 55);
  
  // Tenant info section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Tenant Information / معلومات المستأجر', 20, 65);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  
  // Handle Arabic name by displaying it properly
  const tenantNameLabel = `Name / الاسم: ${data.tenantName}`;
  doc.text(tenantNameLabel, 20, 75);
  
  if (data.phoneNumber) {
    doc.text(`Phone / الهاتف: ${data.phoneNumber}`, 20, 82);
  }
  doc.text(`Status / الحالة: ${data.status}`, 20, data.phoneNumber ? 89 : 82);
  doc.text(`Payment / الدفع: ${data.paymentStatus || 'N/A'}`, 20, data.phoneNumber ? 96 : 89);
  
  // Unit info section
  const unitStartY = data.phoneNumber ? 112 : 105;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Property Details / تفاصيل العقار', 20, unitStartY);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Unit / الوحدة: ${data.unitName}`, 20, unitStartY + 10);
  doc.text(`Type / النوع: ${getUnitTypeEmoji(data.unitType)} ${data.unitType}`, 20, unitStartY + 17);
  
  // Booking dates table
  const tableStartY = unitStartY + 30;
  autoTable(doc, {
    startY: tableStartY,
    head: [['Description / الوصف', 'Details / التفاصيل']],
    body: [
      ['Check-in Date / تاريخ الدخول', data.startDate],
      ['Check-out Date / تاريخ الخروج', data.endDate],
      ['Duration / المدة', `${data.durationDays} day(s) / يوم`],
    ],
    theme: 'striped',
    headStyles: { fillColor: [14, 116, 144] },
    margin: { left: 20, right: 20 },
  });
  
  // Pricing table
  const priceTableY = (doc as any).lastAutoTable.finalY + 15;
  
  const priceBody: string[][] = [
    ['Daily Rate / السعر اليومي', formatEGP(data.dailyRate)],
    ['Duration / المدة', `${data.durationDays} days / أيام`],
    ['Base Amount / المبلغ الأساسي', formatEGP(data.dailyRate * data.durationDays)],
  ];
  
  if (data.depositAmount && data.depositAmount > 0) {
    priceBody.push(['Deposit / العربون', formatEGP(data.depositAmount)]);
  }
  
  if (data.housekeepingAmount && data.housekeepingAmount > 0) {
    priceBody.push(['Housekeeping / التنظيف', formatEGP(data.housekeepingAmount)]);
  }
  
  priceBody.push(['Total Amount / المبلغ الإجمالي', formatEGP(data.totalAmount)]);
  
  autoTable(doc, {
    startY: priceTableY,
    head: [['Pricing / التسعير', 'Amount (EGP) / المبلغ']],
    body: priceBody,
    theme: 'striped',
    headStyles: { fillColor: [14, 116, 144] },
    margin: { left: 20, right: 20 },
    foot: [['Grand Total / الإجمالي', formatEGP(data.totalAmount)]],
    footStyles: { fillColor: [251, 191, 36], textColor: [0, 0, 0], fontStyle: 'bold' },
  });
  
  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(9);
  doc.setTextColor(128, 128, 128);
  doc.text('Thank you for choosing Sunlight Village!', 105, pageHeight - 20, { align: 'center' });
  doc.text('شكراً لاختياركم صن لايت فيليج!', 105, pageHeight - 14, { align: 'center' });
  
  // Save PDF
  const safeFileName = data.tenantName.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
  doc.save(`booking-receipt-${safeFileName}.pdf`);
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

export const generateReportPDF = (data: ReportData) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFillColor(14, 116, 144);
  doc.rect(0, 0, 210, 50, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Sunlight Village', 20, 25);
  
  doc.setFontSize(14);
  doc.text('Financial Report / التقرير المالي', 20, 35);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 44);
  
  // Reset colors
  doc.setTextColor(0, 0, 0);
  
  // Report filters
  doc.setFontSize(11);
  doc.text(`Date Range: ${data.dateRange}`, 20, 60);
  doc.text(`Scope: ${data.unitScope}`, 20, 67);
  
  // Summary cards - Row 1
  doc.setFillColor(240, 240, 240);
  doc.roundedRect(20, 75, 55, 35, 3, 3, 'F');
  doc.roundedRect(80, 75, 55, 35, 3, 3, 'F');
  doc.roundedRect(140, 75, 50, 35, 3, 3, 'F');
  
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Total Revenue', 25, 85);
  doc.text('Total Expenses', 85, 85);
  doc.text('Net Income', 145, 85);
  
  doc.setFontSize(12);
  doc.setTextColor(14, 116, 144);
  doc.setFont('helvetica', 'bold');
  doc.text(formatEGP(data.totalRevenue), 25, 100);
  doc.setTextColor(220, 38, 38);
  doc.text(formatEGP(data.totalExpenses), 85, 100);
  doc.setTextColor(data.netIncome >= 0 ? 22 : 220, data.netIncome >= 0 ? 163 : 38, data.netIncome >= 0 ? 74 : 38);
  doc.text(formatEGP(data.netIncome), 145, 100);
  
  // Summary cards - Row 2
  doc.setFillColor(240, 240, 240);
  doc.roundedRect(20, 115, 55, 35, 3, 3, 'F');
  doc.roundedRect(80, 115, 55, 35, 3, 3, 'F');
  doc.roundedRect(140, 115, 50, 35, 3, 3, 'F');
  
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.text('Total Bookings', 25, 125);
  doc.text('Occupied Days', 85, 125);
  doc.text('Avg. Daily Rate', 145, 125);
  
  doc.setFontSize(12);
  doc.setTextColor(14, 116, 144);
  doc.setFont('helvetica', 'bold');
  doc.text(data.totalBookings.toString(), 25, 140);
  doc.text(`${data.occupiedDays} days`, 85, 140);
  doc.text(formatEGP(data.averageDailyRate), 145, 140);
  
  // Bookings table
  doc.setTextColor(0, 0, 0);
  
  autoTable(doc, {
    startY: 160,
    head: [['Unit', 'Tenant', 'Dates', 'Amount', 'Status', 'Payment']],
    body: data.bookings.map(b => [
      b.unitName,
      b.tenantName,
      b.dates,
      formatEGP(b.amount),
      b.status,
      b.paymentStatus,
    ]),
    theme: 'striped',
    headStyles: { fillColor: [14, 116, 144] },
    margin: { left: 20, right: 20 },
    styles: { fontSize: 8 },
  });
  
  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(9);
  doc.setTextColor(128, 128, 128);
  doc.setFont('helvetica', 'normal');
  doc.text('Sunlight Village Property Management System', 105, pageHeight - 10, { align: 'center' });
  
  // Save PDF
  doc.save(`report-${data.dateRange.replace(/\s+/g, '-')}.pdf`);
};
