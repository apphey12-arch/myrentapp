import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatEGP } from './currency';
import { BookingStatus, UnitType, PaymentStatus, getUnitTypeEmoji } from '@/types/database';
import { Language } from '@/contexts/LanguageContext';
import { shapeArabic } from '@/lib/pdf/arabic-text';

// ============================================================================
// Cairo Font (FORCED for ALL PDFs)
// ============================================================================

/**
 * We MUST NOT rely on jsPDF built-in fonts (helvetica/times/courier) because
 * Arabic glyph support will break and show garbage characters.
 *
 * This loader fetches Cairo at runtime and registers it in the jsPDF VFS.
 */
const CAIRO_TTF_URL_PRIMARY =
  // Preferred: fontsource via jsDelivr (TTF)
  'https://cdn.jsdelivr.net/npm/@fontsource/cairo/files/cairo-arabic-400-normal.ttf';

const CAIRO_TTF_URL_FALLBACK =
  // Fallback (still Cairo): Google Fonts (TTF)
  'https://fonts.gstatic.com/s/cairo/v20/SLXGc1nY6HkvangtZmpcMw.ttf';

let cachedCairoTtfBase64: string | null = null;

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';

  for (let i = 0; i < bytes.length; i += chunkSize) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    binary += String.fromCharCode(...(bytes.subarray(i, i + chunkSize) as any));
  }

  return btoa(binary);
};

const isCairoRegistered = (pdf: jsPDF): boolean => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const list = (pdf as any).getFontList?.() as Record<string, unknown> | undefined;
  return Boolean(list && typeof list === 'object' && 'Cairo' in list);
};

const fetchCairoAsBase64 = async (): Promise<string> => {
  if (cachedCairoTtfBase64) return cachedCairoTtfBase64;

  const tryFetch = async (url: string) => {
    const res = await fetch(url, { mode: 'cors', cache: 'force-cache' });
    if (!res.ok) throw new Error(`Cairo font fetch failed: ${res.status} ${res.statusText}`);
    const buffer = await res.arrayBuffer();
    return arrayBufferToBase64(buffer);
  };

  try {
    cachedCairoTtfBase64 = await tryFetch(CAIRO_TTF_URL_PRIMARY);
    return cachedCairoTtfBase64;
  } catch (e) {
    console.warn('[PDF] Cairo primary URL failed, trying fallback...', e);
    cachedCairoTtfBase64 = await tryFetch(CAIRO_TTF_URL_FALLBACK);
    return cachedCairoTtfBase64;
  }
};

const ensureCairoFont = async (pdf: jsPDF): Promise<void> => {
  if (isCairoRegistered(pdf)) {
    pdf.setFont('Cairo', 'normal');
    return;
  }

  const base64 = await fetchCairoAsBase64();
  if (!base64 || base64.length < 1000) {
    throw new Error('Cairo font data is empty/invalid');
  }

  pdf.addFileToVFS('Cairo-Regular.ttf', base64);
  pdf.addFont('Cairo-Regular.ttf', 'Cairo', 'normal');
  pdf.setFont('Cairo', 'normal');
};

const setRtl = (pdf: jsPDF, isRtl: boolean) => {
  // jsPDF uses setR2L in some builds; user requested setRTL.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (pdf as any).setR2L?.(isRtl);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (pdf as any).setRTL?.(isRtl);
};

const setupPdf = async (
  pdf: jsPDF,
  language: Language
): Promise<{ isArabic: boolean; t: (s: string) => string }> => {
  // 1) Force Cairo (global font)
  await ensureCairoFont(pdf);

  // 2) Mandatory per request
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (pdf as any).setLanguage?.('ar');

  // 3) Direction & shaping
  const isArabic = language === 'ar';
  setRtl(pdf, isArabic);

  const t = (s: string) => (isArabic ? shapeArabic(s) : s);
  return { isArabic, t };
};

// ============================================================================
// PDF Text Labels (Bilingual)
// ============================================================================

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
    pricing: 'Pricing Details',
    amount: 'Amount (EGP)',
    dailyRate: 'Daily Rate',
    baseAmount: 'Base Rent',
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
    pricing: 'تفاصيل التسعير',
    amount: 'المبلغ (ج.م)',
    dailyRate: 'السعر اليومي',
    baseAmount: 'الإيجار الأساسي',
    housekeeping: 'التنظيف',
    refundableDeposit: 'التأمين (مسترد)',
    totalRent: 'إجمالي الإيجار',
    grandTotal: 'المجموع الكلي',
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

// ============================================================================
// Design System Colors (RGB for jsPDF)
// ============================================================================

// Mutable tuples for jsPDF compatibility
type RGB = [number, number, number];

const COLORS: Record<string, RGB> = {
  brand: [14, 38, 74],        // Dark Blue header
  brandText: [255, 255, 255], // White text on brand
  headerBg: [240, 240, 240],  // Light grey table headers
  headerText: [30, 30, 30],   // Dark text
  text: [30, 30, 30],         // Body text
  muted: [110, 110, 110],     // Secondary text
  zebra: [250, 250, 250],     // Alternating row
  border: [200, 200, 200],    // Table borders
  success: [22, 163, 74],     // Green
  danger: [220, 38, 38],      // Red
};

const LAYOUT = {
  marginX: 15,
  marginTop: 50,
  marginBottom: 30,
} as const;

// ============================================================================
// Header & Footer Utilities
// ============================================================================

const drawBrandHeader = (
  pdf: jsPDF,
  title: string,
  subtitle: string,
  isArabic: boolean
) => {
  const pageWidth = pdf.internal.pageSize.getWidth();
  
  // Brand bar
  pdf.setFillColor(...COLORS.brand);
  pdf.rect(0, 0, pageWidth, 35, 'F');
  
  // Title
  pdf.setTextColor(...COLORS.brandText);
  pdf.setFontSize(18);
  pdf.text(`${title} - ${subtitle}`, pageWidth / 2, 20, { align: 'center' });
  
  // Decorative line
  pdf.setDrawColor(...COLORS.border);
  pdf.setLineWidth(0.5);
  pdf.line(LAYOUT.marginX, 40, pageWidth - LAYOUT.marginX, 40);
};

const drawPageFooter = (
  pdf: jsPDF,
  thanksText: string,
  pageText: string
) => {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Decorative line
  pdf.setDrawColor(...COLORS.border);
  pdf.setLineWidth(0.5);
  pdf.line(LAYOUT.marginX, pageHeight - 22, pageWidth - LAYOUT.marginX, pageHeight - 22);
  
  // Thanks text
  pdf.setFontSize(10);
  pdf.setTextColor(...COLORS.muted);
  pdf.text(thanksText, pageWidth / 2, pageHeight - 14, { align: 'center' });
  
  // Page number
  pdf.text(pageText, pageWidth / 2, pageHeight - 8, { align: 'center' });
};

// ============================================================================
// Booking Receipt PDF
// ============================================================================

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
  const pdf = new jsPDF('p', 'mm', 'a4');
  
  // Setup Cairo (FORCED) and get text shaping helper
  const { isArabic, t } = await setupPdf(pdf, language);
  
  // Calculate financials
  const totalRent = data.dailyRate * data.durationDays; // Total Rent = base only
  const housekeeping = data.housekeepingAmount || 0;
  const grandTotal = totalRent + housekeeping;
  const deposit = data.depositAmount || 0;
  
  const pageWidth = pdf.internal.pageSize.getWidth();
  
  // Header - use text shaping for Arabic
  drawBrandHeader(pdf, t(labels.title), t(labels.subtitle), isArabic);
  
  // Date line
  pdf.setFontSize(10);
  pdf.setTextColor(...COLORS.muted);
  const dateStr = `${t(labels.date)}: ${new Date().toLocaleDateString(isArabic ? 'ar-EG' : 'en-US')}`;
  pdf.text(dateStr, pageWidth / 2, 47, { align: 'center' });
  
  let yPos = 55;
  const align = isArabic ? 'right' : 'left';
  
  // Helper for key-value rows with text shaping
  const makeKvRows = (rows: [string, string][]) => 
    isArabic ? rows.map(([k, v]) => [t(v), t(k)]) : rows;
  
  const kvColumnStyles = isArabic
    ? { 0: { halign: 'right' }, 1: { halign: 'right', fontStyle: 'bold', textColor: COLORS.muted } }
    : { 0: { fontStyle: 'bold', textColor: COLORS.muted }, 1: { halign: 'left' } };

  // ─────────────────────────────────────────────────────────────────────────
  // Tenant Information Table
  // ─────────────────────────────────────────────────────────────────────────
  autoTable(pdf, {
    startY: yPos,
    head: [[{ content: t(labels.tenantInfo), colSpan: 2, styles: { fillColor: COLORS.brand, textColor: COLORS.brandText, halign: align } }]],
    body: makeKvRows([
      [labels.name, data.tenantName],
      [labels.phone, data.phoneNumber || '—'],
      [labels.status, data.status],
      [labels.payment, data.paymentStatus || 'Pending'],
    ]) as string[][],
    theme: 'grid',
    styles: { font: 'Cairo', fontSize: 11, cellPadding: 5, halign: align },
    headStyles: { fillColor: COLORS.brand, textColor: COLORS.brandText, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: COLORS.zebra },
    columnStyles: kvColumnStyles as Record<number, object>,
    margin: { left: LAYOUT.marginX, right: LAYOUT.marginX },
  });
  
  yPos = (pdf as any).lastAutoTable.finalY + 10;
  
  // ─────────────────────────────────────────────────────────────────────────
  // Property Details Table
  // ─────────────────────────────────────────────────────────────────────────
  autoTable(pdf, {
    startY: yPos,
    head: [[{ content: t(labels.propertyDetails), colSpan: 2, styles: { fillColor: COLORS.brand, textColor: COLORS.brandText, halign: align } }]],
    body: makeKvRows([
      [labels.unit, `${getUnitTypeEmoji(data.unitType)} ${data.unitName}`],
      [labels.type, data.unitType],
      [labels.checkIn, data.startDate],
      [labels.checkOut, data.endDate],
      [labels.duration, `${data.durationDays} ${labels.days}`],
    ]) as string[][],
    theme: 'grid',
    styles: { font: 'Cairo', fontSize: 11, cellPadding: 5, halign: align },
    headStyles: { fillColor: COLORS.brand, textColor: COLORS.brandText, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: COLORS.zebra },
    columnStyles: kvColumnStyles as Record<number, object>,
    margin: { left: LAYOUT.marginX, right: LAYOUT.marginX },
  });
  
  yPos = (pdf as any).lastAutoTable.finalY + 10;
  
  // ─────────────────────────────────────────────────────────────────────────
  // Pricing Table
  // ─────────────────────────────────────────────────────────────────────────
  const pricingRows: [string, string][] = [];
  pricingRows.push([t(labels.dailyRate), formatEGP(data.dailyRate)]);
  pricingRows.push([t(labels.duration), `${data.durationDays} ${t(labels.days)}`]);
  pricingRows.push([t(labels.totalRent), formatEGP(totalRent)]);
  if (housekeeping > 0) {
    pricingRows.push([t(labels.housekeeping), formatEGP(housekeeping)]);
  }
  pricingRows.push([t(labels.grandTotal), formatEGP(grandTotal)]);
  
  const shapedPricing = t(labels.pricing);
  const shapedDescription = t(labels.description);
  const shapedAmount = t(labels.amount);
  
  const pricingHead = isArabic
    ? [[{ content: shapedPricing, colSpan: 2, styles: { fillColor: COLORS.brand, textColor: COLORS.brandText, halign: 'right' } }], [shapedAmount, shapedDescription]]
    : [[{ content: shapedPricing, colSpan: 2, styles: { fillColor: COLORS.brand, textColor: COLORS.brandText, halign: 'left' } }], [shapedDescription, shapedAmount]];
  
  const pricingBody = isArabic
    ? pricingRows.map(([k, v]) => [v, k])
    : pricingRows;
  
  const shapedGrandTotal = t(labels.grandTotal);
  
  autoTable(pdf, {
    startY: yPos,
    head: pricingHead as any,
    body: pricingBody as string[][],
    theme: 'grid',
    styles: { font: 'Cairo', fontSize: 11, cellPadding: 6, halign: align },
    headStyles: { fillColor: COLORS.brand, textColor: COLORS.brandText, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: COLORS.zebra },
    columnStyles: isArabic
      ? { 0: { halign: 'right', cellWidth: 50 }, 1: { halign: 'right' } }
      : { 0: { halign: 'left' }, 1: { halign: 'right', cellWidth: 50 } },
    margin: { left: LAYOUT.marginX, right: LAYOUT.marginX },
    didParseCell: (hookData) => {
      const rowData = hookData.row.raw as string[] | undefined;
      if (!rowData) return;
      
      const labelCell = isArabic ? rowData[1] : rowData[0];
      
      // Bold Grand Total
      if (labelCell?.includes(shapedGrandTotal)) {
        hookData.cell.styles.fontStyle = 'bold';
        hookData.cell.styles.fillColor = [230, 240, 250];
      }
      // Italic deposit note
      if (labelCell?.includes('*')) {
        hookData.cell.styles.fontStyle = 'italic';
        hookData.cell.styles.textColor = COLORS.muted;
      }
    },
  });
  
  yPos = (pdf as any).lastAutoTable.finalY + 8;
  
  // Deposit note (Refundable) - MUST NOT be included in Grand Total
  if (deposit > 0) {
    pdf.setFontSize(10);
    pdf.setTextColor(...COLORS.muted);
    const depositLine = isArabic
      ? `${t(labels.refundableDeposit)}: ${formatEGP(deposit)}`
      : `${labels.refundableDeposit}: ${formatEGP(deposit)} (Refundable)`;

    pdf.text(depositLine, isArabic ? pageWidth - LAYOUT.marginX : LAYOUT.marginX, yPos, { align });
  }
  
  // Footer on all pages
  const totalPages = pdf.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    pdf.setPage(p);
    drawPageFooter(pdf, t(labels.thanks), `${t(labels.page)} ${p} ${t(labels.of)} ${totalPages}`);
  }
  
  // Save
  const safeName = data.tenantName.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-') || 'booking';
  pdf.save(`receipt-${safeName}.pdf`);
};

// ============================================================================
// Financial Report PDF
// ============================================================================

interface ReportData {
  dateRange: string;
  unitScope: string;
  totalRevenue: number;
  housekeepingTotal?: number;
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
  const pdf = new jsPDF('p', 'mm', 'a4');
  
  const { isArabic, t } = await setupPdf(pdf, language);
  
  const pageWidth = pdf.internal.pageSize.getWidth();
  const totalPagesPlaceholder = '{total_pages_count_string}';
  
  // Header
  drawBrandHeader(pdf, t(labels.title), t(labels.reportTitle), isArabic);
  
  // Meta info
  pdf.setFontSize(10);
  pdf.setTextColor(...COLORS.muted);
  const metaLine1 = `${t(labels.generated)}: ${new Date().toLocaleDateString(isArabic ? 'ar-EG' : 'en-US')}`;
  const metaLine2 = `${t(labels.dateRange)}: ${data.dateRange} | ${t(labels.scope)}: ${data.unitScope}`;
  pdf.text(metaLine1, pageWidth / 2, 47, { align: 'center' });
  pdf.text(metaLine2, pageWidth / 2, 53, { align: 'center' });
  
  let yPos = 62;
  const align = isArabic ? 'right' : 'left';
  
  // Summary stats - with text shaping
  const statsRows: [string, string][] = [
    [t(labels.totalRevenue), formatEGP(data.totalRevenue)],
  ];
  if (data.housekeepingTotal && data.housekeepingTotal > 0) {
    statsRows.push([t(labels.housekeeping), formatEGP(data.housekeepingTotal)]);
  }
  statsRows.push(
    [t(labels.totalBookings), data.totalBookings.toString()],
    [t(labels.occupiedDays), `${data.occupiedDays} ${t(labels.days)}`],
    [t(labels.avgDailyRate), formatEGP(data.averageDailyRate)]
  );
  
  autoTable(pdf, {
    startY: yPos,
    body: (isArabic ? statsRows.map(([k, v]) => [v, k]) : statsRows) as string[][],
    theme: 'grid',
    styles: { font: 'Cairo', fontSize: 12, cellPadding: 6, halign: align },
    columnStyles: isArabic
      ? { 0: { fontStyle: 'bold', halign: 'right' }, 1: { textColor: COLORS.muted, halign: 'right' } }
      : { 0: { fontStyle: 'bold', textColor: COLORS.muted }, 1: { halign: 'right' } },
    alternateRowStyles: { fillColor: COLORS.zebra },
    margin: { left: LAYOUT.marginX, right: LAYOUT.marginX },
  });
  
  yPos = (pdf as any).lastAutoTable.finalY + 15;
  
  // Bookings section title
  pdf.setFontSize(14);
  pdf.setTextColor(...COLORS.text);
  pdf.text(t(labels.totalBookings), isArabic ? pageWidth - LAYOUT.marginX : LAYOUT.marginX, yPos, { align });
  yPos += 8;
  
  // Bookings table with pagination - headers shaped
  const headCols = [t(labels.unit), t(labels.tenant), t(labels.dates), t(labels.amount), t(labels.status), t(labels.payment)];
  const headRow = isArabic ? [...headCols].reverse() : headCols;
  
  autoTable(pdf, {
    startY: yPos,
    head: [headRow],
    body: data.bookings.map((b) => {
      const row = [t(b.unitName), t(b.tenantName), b.dates, formatEGP(b.amount), b.status, b.paymentStatus];
      return isArabic ? row.reverse() : row;
    }),
    theme: 'grid',
    styles: { font: 'Cairo', fontSize: 9, cellPadding: 4, halign: align },
    headStyles: { fillColor: COLORS.brand, textColor: COLORS.brandText, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: COLORS.zebra },
    margin: { left: LAYOUT.marginX, right: LAYOUT.marginX, top: LAYOUT.marginTop, bottom: LAYOUT.marginBottom },
    showHead: 'everyPage',
    didDrawPage: (hookData) => {
      // Redraw header on new pages
      if (hookData.pageNumber > 1) {
        drawBrandHeader(pdf, t(labels.title), t(labels.reportTitle), isArabic);
      }
      drawPageFooter(pdf, t(labels.thanks), `${t(labels.page)} ${hookData.pageNumber} ${t(labels.of)} ${totalPagesPlaceholder}`);
    },
  });
  
  // Replace total pages placeholder
  (pdf as any).putTotalPages?.(totalPagesPlaceholder);
  
  pdf.save(`report-${data.dateRange.replace(/\s+/g, '-')}.pdf`);
};

// ============================================================================
// Unit Performance Report PDF
// ============================================================================

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
  housekeepingTotal: number = 0,
  language: Language = 'en'
) => {
  const labels = pdfLabels[language];
  const pdf = new jsPDF('p', 'mm', 'a4');
  
  const { isArabic, t } = await setupPdf(pdf, language);
  
  const pageWidth = pdf.internal.pageSize.getWidth();
  const totalPagesPlaceholder = '{total_pages_count_string}';
  
  // Header
  drawBrandHeader(pdf, t(labels.title), t(labels.unitPerformance), isArabic);
  
  // Meta info
  pdf.setFontSize(10);
  pdf.setTextColor(...COLORS.muted);
  pdf.text(`${t(labels.generated)}: ${new Date().toLocaleDateString(isArabic ? 'ar-EG' : 'en-US')}`, pageWidth / 2, 47, { align: 'center' });
  pdf.text(`${t(labels.dateRange)}: ${dateRange}`, pageWidth / 2, 53, { align: 'center' });
  
  let yPos = 62;
  const align = isArabic ? 'right' : 'left';
  
  // Calculate totals
  const totalRevenue = units.reduce((s, u) => s + u.totalRevenue, 0);
  const totalExpenses = units.reduce((s, u) => s + u.totalExpenses, 0);
  const netProfit = totalRevenue - totalExpenses;
  
  // Summary - with text shaping
  const summaryRows: [string, string][] = [[t(labels.totalRevenue), formatEGP(totalRevenue)]];
  if (housekeepingTotal > 0) {
    summaryRows.push([t(labels.housekeeping), formatEGP(housekeepingTotal)]);
  }
  summaryRows.push(
    [t(labels.totalExpenses), formatEGP(totalExpenses)],
    [t(labels.netProfit), formatEGP(netProfit)]
  );
  
  autoTable(pdf, {
    startY: yPos,
    body: (isArabic ? summaryRows.map(([k, v]) => [v, k]) : summaryRows) as string[][],
    theme: 'grid',
    styles: { font: 'Cairo', fontSize: 12, cellPadding: 6, halign: align },
    columnStyles: isArabic
      ? { 0: { fontStyle: 'bold', halign: 'right' }, 1: { textColor: COLORS.muted, halign: 'right' } }
      : { 0: { fontStyle: 'bold', textColor: COLORS.muted }, 1: { halign: 'right' } },
    alternateRowStyles: { fillColor: COLORS.zebra },
    margin: { left: LAYOUT.marginX, right: LAYOUT.marginX },
    didParseCell: (hookData) => {
      if (hookData.row.index === 0) {
        hookData.cell.styles.textColor = COLORS.success;
      } else if (hookData.row.index === summaryRows.length - 2) {
        hookData.cell.styles.textColor = COLORS.danger;
      } else if (hookData.row.index === summaryRows.length - 1) {
        hookData.cell.styles.textColor = netProfit >= 0 ? COLORS.success : COLORS.danger;
        hookData.cell.styles.fontStyle = 'bold';
      }
    },
  });
  
  yPos = (pdf as any).lastAutoTable.finalY + 15;
  
  // Units table - headers shaped
  const headCols = [t(labels.unit), t(labels.type), t(labels.totalRevenue), t(labels.totalExpenses), t(labels.netProfit)];
  const headRow = isArabic ? [...headCols].reverse() : headCols;
  
  autoTable(pdf, {
    startY: yPos,
    head: [headRow],
    body: units.map((u) => {
      const row = [
        `${getUnitTypeEmoji(u.unitType)} ${t(u.unitName)}`,
        u.unitType,
        formatEGP(u.totalRevenue),
        formatEGP(u.totalExpenses),
        formatEGP(u.netProfit),
      ];
      return isArabic ? row.reverse() : row;
    }),
    theme: 'grid',
    styles: { font: 'Cairo', fontSize: 10, cellPadding: 5, halign: align },
    headStyles: { fillColor: COLORS.brand, textColor: COLORS.brandText, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: COLORS.zebra },
    margin: { left: LAYOUT.marginX, right: LAYOUT.marginX, top: LAYOUT.marginTop, bottom: LAYOUT.marginBottom },
    showHead: 'everyPage',
    didDrawPage: (hookData) => {
      if (hookData.pageNumber > 1) {
        drawBrandHeader(pdf, t(labels.title), t(labels.unitPerformance), isArabic);
      }
      drawPageFooter(pdf, t(labels.thanks), `${t(labels.page)} ${hookData.pageNumber} ${t(labels.of)} ${totalPagesPlaceholder}`);
    },
    didParseCell: (hookData) => {
      // Color the Net Profit column
      const profitColIndex = isArabic ? 0 : 4;
      if (hookData.column.index === profitColIndex && hookData.section === 'body') {
        const unit = units[hookData.row.index];
        if (unit) {
          hookData.cell.styles.textColor = unit.netProfit >= 0 ? COLORS.success : COLORS.danger;
          hookData.cell.styles.fontStyle = 'bold';
        }
      }
    },
  });
  
  (pdf as any).putTotalPages?.(totalPagesPlaceholder);
  
  pdf.save(`unit-performance-${dateRange.replace(/\s+/g, '-')}.pdf`);
};
