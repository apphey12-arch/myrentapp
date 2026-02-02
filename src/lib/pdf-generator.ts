import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatEGP } from './currency';
import { BookingStatus, UnitType, PaymentStatus, getUnitTypeEmoji } from '@/types/database';
import { Language } from '@/contexts/LanguageContext';

// Cairo font embedded as Base64 (Regular weight subset for Arabic/Latin)
// This is a subset of the Cairo font from Google Fonts
const CAIRO_FONT_BASE64 = 'AAEAAAAOAIAAAwBgRkZUTZ3rOsQAAXKoAAAAHEdERUYBFQQVAAFvFAAAACBHUE9TJFfqGwABdXgAACEwR1NVQtFiLB0AAW80AAAGQk9TLzJZN6u4AAABiAAAAFZjbWFwJo4bNwAABO'
// Note: Full font embedding would be very large. Using a simpler approach.

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
  },
};

// Helper to setup font for Arabic
const setupArabicFont = (doc: jsPDF) => {
  // jsPDF doesn't natively support Arabic well, but we can use Unicode
  // For proper Arabic, we set the font and handle RTL manually
  doc.setFont('helvetica');
};

// Helper to check if text contains Arabic
const containsArabic = (text: string): boolean => {
  return /[\u0600-\u06FF]/.test(text);
};

// Reverse Arabic text for proper RTL rendering in PDF
const processArabicText = (text: string, isArabicDoc: boolean): string => {
  if (!containsArabic(text)) return text;
  // For Arabic documents, we reverse character order for proper display
  if (isArabicDoc) {
    return text.split('').reverse().join('');
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

export const generateBookingPDF = (data: BookingReceiptData, language: Language = 'en') => {
  const doc = new jsPDF();
  const labels = pdfLabels[language];
  const isArabic = language === 'ar';
  
  setupArabicFont(doc);
  
  // Header
  doc.setFillColor(14, 116, 144); // Ocean blue
  doc.rect(0, 0, 210, 45, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  
  if (isArabic) {
    doc.text(labels.title, 190, 25, { align: 'right' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(labels.subtitle, 190, 35, { align: 'right' });
  } else {
    doc.text(labels.title, 20, 25);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(labels.subtitle, 20, 35);
  }
  
  // Reset colors
  doc.setTextColor(0, 0, 0);
  
  // Receipt details
  doc.setFontSize(10);
  const dateText = `${labels.date}: ${new Date().toLocaleDateString(isArabic ? 'ar-EG' : 'en-US')}`;
  doc.text(dateText, isArabic ? 20 : 150, 55);
  
  // Tenant info section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(labels.tenantInfo, isArabic ? 190 : 20, 65, { align: isArabic ? 'right' : 'left' });
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  
  // Handle tenant name - display as-is (mixed content)
  const tenantNameLabel = `${labels.name}: ${data.tenantName}`;
  doc.text(tenantNameLabel, isArabic ? 190 : 20, 75, { align: isArabic ? 'right' : 'left' });
  
  if (data.phoneNumber) {
    doc.text(`${labels.phone}: ${data.phoneNumber}`, isArabic ? 190 : 20, 82, { align: isArabic ? 'right' : 'left' });
  }
  
  const statusY = data.phoneNumber ? 89 : 82;
  doc.text(`${labels.status}: ${data.status}`, isArabic ? 190 : 20, statusY, { align: isArabic ? 'right' : 'left' });
  doc.text(`${labels.payment}: ${data.paymentStatus || 'N/A'}`, isArabic ? 190 : 20, statusY + 7, { align: isArabic ? 'right' : 'left' });
  
  // Unit info section
  const unitStartY = data.phoneNumber ? 112 : 105;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(labels.propertyDetails, isArabic ? 190 : 20, unitStartY, { align: isArabic ? 'right' : 'left' });
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`${labels.unit}: ${data.unitName}`, isArabic ? 190 : 20, unitStartY + 10, { align: isArabic ? 'right' : 'left' });
  doc.text(`${labels.type}: ${getUnitTypeEmoji(data.unitType)} ${data.unitType}`, isArabic ? 190 : 20, unitStartY + 17, { align: isArabic ? 'right' : 'left' });
  
  // Booking dates table
  const tableStartY = unitStartY + 30;
  autoTable(doc, {
    startY: tableStartY,
    head: [[labels.description, labels.details]],
    body: [
      [labels.checkIn, data.startDate],
      [labels.checkOut, data.endDate],
      [labels.duration, `${data.durationDays} ${labels.days}`],
    ],
    theme: 'striped',
    headStyles: { fillColor: [14, 116, 144], halign: isArabic ? 'right' : 'left' },
    bodyStyles: { halign: isArabic ? 'right' : 'left' },
    margin: { left: 20, right: 20 },
  });
  
  // Pricing table - DEPOSIT IS SEPARATE (not included in Total Rent)
  const priceTableY = (doc as any).lastAutoTable.finalY + 15;
  
  const baseAmount = data.dailyRate * data.durationDays;
  const housekeepingAmount = data.housekeepingAmount || 0;
  // Total Rent = Base + Housekeeping (NO deposit)
  const totalRent = baseAmount + housekeepingAmount;
  
  const priceBody: string[][] = [
    [labels.dailyRate, formatEGP(data.dailyRate)],
    [labels.duration, `${data.durationDays} ${labels.days}`],
    [labels.baseAmount, formatEGP(baseAmount)],
  ];
  
  if (housekeepingAmount > 0) {
    priceBody.push([labels.housekeeping, formatEGP(housekeepingAmount)]);
  }
  
  // Total Rent (without deposit)
  priceBody.push([labels.totalRent, formatEGP(totalRent)]);
  
  // Add refundable deposit as separate line (not in total)
  if (data.depositAmount && data.depositAmount > 0) {
    priceBody.push([`${labels.refundableDeposit}*`, formatEGP(data.depositAmount)]);
  }
  
  autoTable(doc, {
    startY: priceTableY,
    head: [[labels.pricing, labels.amount]],
    body: priceBody,
    theme: 'striped',
    headStyles: { fillColor: [14, 116, 144], halign: isArabic ? 'right' : 'left' },
    bodyStyles: { halign: isArabic ? 'right' : 'left' },
    margin: { left: 20, right: 20 },
    foot: [[labels.grandTotal, formatEGP(totalRent)]],
    footStyles: { fillColor: [251, 191, 36], textColor: [0, 0, 0], fontStyle: 'bold', halign: isArabic ? 'right' : 'left' },
  });
  
  // Add note about refundable deposit
  if (data.depositAmount && data.depositAmount > 0) {
    const noteY = (doc as any).lastAutoTable.finalY + 8;
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    const depositNote = isArabic 
      ? '* التأمين مبلغ مسترد ولا يدخل ضمن إجمالي الإيجار'
      : '* Deposit is refundable and not included in Total Rent';
    doc.text(depositNote, isArabic ? 190 : 20, noteY, { align: isArabic ? 'right' : 'left' });
  }
  
  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(9);
  doc.setTextColor(128, 128, 128);
  doc.text(labels.thanks, 105, pageHeight - 15, { align: 'center' });
  
  // Save PDF
  const safeFileName = data.tenantName.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-') || 'booking';
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

export const generateReportPDF = (data: ReportData, language: Language = 'en') => {
  const doc = new jsPDF();
  const labels = pdfLabels[language];
  const isArabic = language === 'ar';
  
  setupArabicFont(doc);
  
  // Header
  doc.setFillColor(14, 116, 144);
  doc.rect(0, 0, 210, 50, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  
  if (isArabic) {
    doc.text(labels.title, 190, 25, { align: 'right' });
    doc.setFontSize(14);
    doc.text(labels.reportTitle, 190, 35, { align: 'right' });
  } else {
    doc.text(labels.title, 20, 25);
    doc.setFontSize(14);
    doc.text(labels.reportTitle, 20, 35);
  }
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const generatedText = `${labels.generated}: ${new Date().toLocaleDateString(isArabic ? 'ar-EG' : 'en-US')}`;
  doc.text(generatedText, isArabic ? 190 : 20, 44, { align: isArabic ? 'right' : 'left' });
  
  // Reset colors
  doc.setTextColor(0, 0, 0);
  
  // Report filters
  doc.setFontSize(11);
  doc.text(`${labels.dateRange}: ${data.dateRange}`, isArabic ? 190 : 20, 60, { align: isArabic ? 'right' : 'left' });
  doc.text(`${labels.scope}: ${data.unitScope}`, isArabic ? 190 : 20, 67, { align: isArabic ? 'right' : 'left' });
  
  // Summary cards - Row 1
  doc.setFillColor(240, 240, 240);
  doc.roundedRect(20, 75, 55, 35, 3, 3, 'F');
  doc.roundedRect(80, 75, 55, 35, 3, 3, 'F');
  doc.roundedRect(140, 75, 50, 35, 3, 3, 'F');
  
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(labels.totalRevenue, 25, 85);
  doc.text(labels.totalExpenses, 85, 85);
  doc.text(labels.netIncome, 145, 85);
  
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
  doc.text(labels.totalBookings, 25, 125);
  doc.text(labels.occupiedDays, 85, 125);
  doc.text(labels.avgDailyRate, 145, 125);
  
  doc.setFontSize(12);
  doc.setTextColor(14, 116, 144);
  doc.setFont('helvetica', 'bold');
  doc.text(data.totalBookings.toString(), 25, 140);
  doc.text(`${data.occupiedDays} ${labels.days}`, 85, 140);
  doc.text(formatEGP(data.averageDailyRate), 145, 140);
  
  // Bookings table
  doc.setTextColor(0, 0, 0);
  
  autoTable(doc, {
    startY: 160,
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
    headStyles: { fillColor: [14, 116, 144], halign: isArabic ? 'right' : 'left' },
    bodyStyles: { halign: isArabic ? 'right' : 'left' },
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
