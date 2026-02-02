import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatEGP } from './currency';
import { BookingStatus, UnitType, PaymentStatus, getUnitTypeEmoji } from '@/types/database';
import { Language } from '@/contexts/LanguageContext';

import { applyArabicFont } from '@/lib/pdf/pdf-font';
import { shapeArabic } from '@/lib/pdf/arabic-text';

// PDF text labels in both languages
const pdfLabels = {
  en: {
    title: 'Sunlight Village',
    subtitle: 'Official Booking Receipt',
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
    baseAmount: 'Base Rent',
    housekeeping: 'Housekeeping',
    refundableDeposit: 'Refundable Deposit',
    totalRent: 'Total Rent',
    grandTotal: 'Grand Total',
    thanks: 'Thank you for your business',
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

// Setup PDF with Arabic font (async - fetches font from CDN)
const setupPdfWithFont = async (pdf: jsPDF, isArabic: boolean): Promise<void> => {
  if (isArabic) {
    await applyArabicFont(pdf);
  } else {
    (pdf as any).setR2L?.(false);
    pdf.setFont('helvetica', 'normal');
  }
};

// Add header to PDF page (clean, professional layout)
const addPdfHeader = (pdf: jsPDF, title: string, subtitle: string) => {
  const pageWidth = pdf.internal.pageSize.getWidth();

  pdf.setTextColor(20, 20, 20);
  pdf.setFontSize(20);
  pdf.text(title, pageWidth / 2, 18, { align: 'center' });

  pdf.setFontSize(11);
  pdf.setTextColor(90, 90, 90);
  pdf.text(subtitle, pageWidth / 2, 28, { align: 'center' });

  // Divider
  pdf.setDrawColor(210, 210, 210);
  pdf.setLineWidth(0.6);
  pdf.line(15, 35, pageWidth - 15, 35);
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
  const t = (s: string) => (isArabic ? shapeArabic(s) : s);
  
  const baseAmount = data.dailyRate * data.durationDays;
  const housekeepingAmount = data.housekeepingAmount || 0;
  const totalRent = baseAmount; // Total Rent is Base Rent ONLY
  const grandTotal = baseAmount + housekeepingAmount;
  
  const pdf = new jsPDF('p', 'mm', 'a4');
  await setupPdfWithFont(pdf, isArabic);
  
  const pageWidth = pdf.internal.pageSize.getWidth();
  const marginX = 15;
  
  // Header
  addPdfHeader(pdf, t(labels.title), t(labels.subtitle));
  
  // Date
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  const dateText = `${t(labels.date)}: ${new Date().toLocaleDateString(isArabic ? 'ar-EG' : 'en-US')}`;
  pdf.text(dateText, pageWidth / 2, 50, { align: 'center' });
  
  let yPos = 60;

  const kvRows = (rows: Array<[string, string]>) =>
    isArabic ? rows.map(([k, v]) => [v, k]) : rows;

  const kvColumnStyles = isArabic
    ? {
        0: { cellWidth: 'auto', halign: 'right' },
        1: { fontStyle: 'bold', cellWidth: 55, textColor: [100, 100, 100], halign: 'right' },
      }
    : {
        0: { fontStyle: 'bold', cellWidth: 55, textColor: [100, 100, 100] },
        1: { cellWidth: 'auto' },
      };
  
  // Tenant Information
  autoTable(pdf, {
    startY: yPos,
    head: [
      [
        {
          content: t(labels.tenantInfo),
          colSpan: 2,
          styles: {
            fillColor: [245, 245, 245],
            textColor: [40, 40, 40],
            fontStyle: 'bold',
            halign: isArabic ? 'right' : 'left',
          },
        },
      ],
    ] as any,
    body: kvRows([
      [t(labels.name), t(data.tenantName)],
      [t(labels.phone), t(data.phoneNumber || '—')],
      [t(labels.status), t(data.status)],
      [t(labels.payment), t(data.paymentStatus || 'Pending')],
    ]),
    theme: 'grid',
    styles: {
      font: isArabic ? 'Cairo' : 'helvetica',
      fontSize: 11,
      cellPadding: 4,
      overflow: 'linebreak',
      halign: isArabic ? 'right' : 'left',
    },
    headStyles: {
      fillColor: [245, 245, 245],
      textColor: [40, 40, 40],
      fontStyle: 'bold',
    },
    columnStyles: kvColumnStyles as any,
    margin: { left: marginX, right: marginX },
  });
  
  yPos = (pdf as any).lastAutoTable.finalY + 12;
  
  // Unit Details
  autoTable(pdf, {
    startY: yPos,
    head: [
      [
        {
          content: t(labels.propertyDetails),
          colSpan: 2,
          styles: {
            fillColor: [245, 245, 245],
            textColor: [40, 40, 40],
            fontStyle: 'bold',
            halign: isArabic ? 'right' : 'left',
          },
        },
      ],
    ] as any,
    body: kvRows([
      [t(labels.unit), t(`${getUnitTypeEmoji(data.unitType)} ${data.unitName}`)],
      [t(labels.type), t(data.unitType)],
      [t(labels.checkIn), t(data.startDate)],
      [t(labels.checkOut), t(data.endDate)],
      [t(labels.duration), t(`${data.durationDays} ${labels.days}`)],
    ]),
    theme: 'grid',
    styles: {
      font: isArabic ? 'Cairo' : 'helvetica',
      fontSize: 11,
      cellPadding: 4,
      overflow: 'linebreak',
      halign: isArabic ? 'right' : 'left',
    },
    headStyles: {
      fillColor: [245, 245, 245],
      textColor: [40, 40, 40],
      fontStyle: 'bold',
    },
    columnStyles: kvColumnStyles as any,
    margin: { left: marginX, right: marginX },
  });
  
  yPos = (pdf as any).lastAutoTable.finalY + 12;
  
  const pricingRows: Array<[string, string]> = [
    [`${t(labels.baseAmount)}`, formatEGP(baseAmount)],
  ];
  if (housekeepingAmount > 0) pricingRows.push([t(labels.housekeeping), formatEGP(housekeepingAmount)]);

  // Total Rent = Base Rent only
  pricingRows.push([t(labels.totalRent), formatEGP(totalRent)]);
  // Grand Total = Base + Housekeeping
  pricingRows.push([t(labels.grandTotal), formatEGP(grandTotal)]);

  if (data.depositAmount && data.depositAmount > 0) {
    pricingRows.push([`${t(labels.refundableDeposit)} *`, formatEGP(data.depositAmount)]);
  }

  const pricingHead = isArabic
    ? ([
        [
          {
            content: t(labels.pricing),
            colSpan: 2,
            styles: {
              fillColor: [245, 245, 245],
              textColor: [40, 40, 40],
              fontStyle: 'bold',
              halign: 'right',
            },
          },
        ],
        [t(labels.amount), t(labels.description)],
      ] as any)
    : ([
        [
          {
            content: t(labels.pricing),
            colSpan: 2,
            styles: {
              fillColor: [245, 245, 245],
              textColor: [40, 40, 40],
              fontStyle: 'bold',
              halign: 'left',
            },
          },
        ],
        [t(labels.description), t(labels.amount)],
      ] as any);

  const pricingBody = (isArabic
    ? pricingRows.map(([k, v]) => [v, k])
    : pricingRows.map(([k, v]) => [k, v])) as any;

  const pricingColumnStyles = isArabic
    ? {
        0: { cellWidth: 55, halign: 'right' },
        1: { cellWidth: 'auto', halign: 'right' },
      }
    : {
        0: { cellWidth: 'auto', halign: 'left' },
        1: { cellWidth: 55, halign: 'right' },
      };
  
  autoTable(pdf, {
    startY: yPos,
    head: pricingHead,
    body: pricingBody,
    theme: 'grid',
    styles: {
      font: isArabic ? 'Cairo' : 'helvetica',
      fontSize: 11,
      cellPadding: 5,
      overflow: 'linebreak',
      halign: isArabic ? 'right' : 'left',
    },
    headStyles: {
      fillColor: [245, 245, 245],
      textColor: [40, 40, 40],
      fontStyle: 'bold',
    },
    columnStyles: pricingColumnStyles as any,
    margin: { left: marginX, right: marginX },
    didParseCell: (data) => {
      const raw0 = (data.row.raw as any)?.[0] as string | undefined;
      const raw1 = (data.row.raw as any)?.[1] as string | undefined;
      const labelCell = isArabic ? raw1 : raw0;

      // Highlight Total Rent and Grand Total rows
      if (labelCell?.includes(labels.totalRent) || labelCell?.includes(labels.grandTotal)) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [250, 250, 250];
      }
      // Style deposit row
      if (labelCell?.includes('*')) {
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
    pdf.text(t(labels.depositNote), isArabic ? pageWidth - marginX : marginX, yPos, { align: isArabic ? 'right' : 'left' });
  }

  // Footer + page numbers on every page
  const pageHeight = pdf.internal.pageSize.getHeight();
  const totalPages = pdf.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    pdf.setPage(p);
    pdf.setDrawColor(200, 200, 200);
    pdf.line(marginX, pageHeight - 25, pageWidth - marginX, pageHeight - 25);

    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text(t(labels.thanks), pageWidth / 2, pageHeight - 15, { align: 'center' });

    pdf.setFontSize(10);
    pdf.setTextColor(130, 130, 130);
    pdf.text(`${t(labels.page)} ${p} ${t(labels.of)} ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }
  
  pdf.save(`booking-receipt-${data.tenantName.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-') || 'booking'}.pdf`);
};

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
  const isArabic = language === 'ar';
  const t = (s: string) => (isArabic ? shapeArabic(s) : s);
  
  const pdf = new jsPDF('p', 'mm', 'a4');
  await setupPdfWithFont(pdf, isArabic);
  
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const marginX = 15;
  const totalPagesExp = '{total_pages_count_string}';
  
  // Header
  addPdfHeader(pdf, t(labels.title), t(labels.reportTitle));
  
  // Date and filters
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  pdf.text(`${t(labels.generated)}: ${new Date().toLocaleDateString(isArabic ? 'ar-EG' : 'en-US')}`, pageWidth / 2, 50, { align: 'center' });
  pdf.text(`${t(labels.dateRange)}: ${data.dateRange} | ${t(labels.scope)}: ${data.unitScope}`, pageWidth / 2, 57, { align: 'center' });
  
  let yPos = 70;
  
  // Summary Stats
  const statsData: Array<[string, string]> = [
    [t(labels.totalRevenue), formatEGP(data.totalRevenue)],
  ];
  if (typeof data.housekeepingTotal === 'number' && data.housekeepingTotal > 0) {
    statsData.push([t(labels.housekeeping), formatEGP(data.housekeepingTotal)]);
  }
  statsData.push(
    [t(labels.totalBookings), data.totalBookings.toString()],
    [t(labels.occupiedDays), `${data.occupiedDays} ${t(labels.days)}`],
    [t(labels.avgDailyRate), formatEGP(data.averageDailyRate)]
  );
  
  autoTable(pdf, {
    startY: yPos,
    head: [],
    body: (isArabic ? statsData.map(([k, v]) => [v, k]) : statsData) as any,
    theme: 'grid',
    styles: {
      font: isArabic ? 'Cairo' : 'helvetica',
      fontSize: 12,
      cellPadding: 6,
      overflow: 'linebreak',
      halign: isArabic ? 'right' : 'left',
    },
    columnStyles: {
      0: isArabic ? { fontStyle: 'bold', halign: 'right' } : { fontStyle: 'bold', textColor: [100, 100, 100] },
      1: isArabic
        ? { fontStyle: 'bold', textColor: [100, 100, 100], halign: 'right' }
        : { fontStyle: 'bold', halign: 'right' },
    },
    margin: { left: marginX, right: marginX },
  });
  
  yPos = (pdf as any).lastAutoTable.finalY + 15;
  
  // Bookings table with auto-pagination
  const drawHeaderAndFooter = (pageNumber: number) => {
    addPdfHeader(pdf, t(labels.title), t(labels.reportTitle));
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text(
      `${t(labels.generated)}: ${new Date().toLocaleDateString(isArabic ? 'ar-EG' : 'en-US')}`,
      pageWidth / 2,
      50,
      { align: 'center' }
    );
    pdf.text(
      `${t(labels.dateRange)}: ${data.dateRange} | ${t(labels.scope)}: ${data.unitScope}`,
      pageWidth / 2,
      57,
      { align: 'center' }
    );

    pdf.setFontSize(10);
    pdf.setTextColor(130, 130, 130);
    pdf.text(
      `${t(labels.page)} ${pageNumber} ${t(labels.of)} ${totalPagesExp}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  };

  pdf.setFontSize(14);
  pdf.setTextColor(20, 20, 20);
  pdf.text(t(labels.totalBookings), isArabic ? pageWidth - marginX : marginX, yPos, { align: isArabic ? 'right' : 'left' });
  yPos += 8;
  
  autoTable(pdf, {
    startY: yPos,
    head: [
      [
        t(labels.unit),
        t(labels.tenant),
        t(labels.dates),
        t(labels.amount),
        t(labels.status),
        t(labels.payment),
      ],
    ],
    body: data.bookings.map(b => [
      t(b.unitName),
      t(b.tenantName),
      t(b.dates),
      formatEGP(b.amount),
      t(b.status),
      t(b.paymentStatus),
    ]),
    theme: 'grid',
    styles: {
      font: isArabic ? 'Cairo' : 'helvetica',
      fontSize: 9,
      cellPadding: 4,
      overflow: 'linebreak',
      halign: isArabic ? 'right' : 'left',
    },
    headStyles: {
      fillColor: [245, 245, 245],
      textColor: [40, 40, 40],
      fontStyle: 'bold',
    },
    margin: { left: marginX, right: marginX },
    // Auto-pagination: this will automatically create new pages
    showHead: 'everyPage',
    didDrawPage: (hookData) => drawHeaderAndFooter(hookData.pageNumber),
  });

  // Replace total pages placeholder
  (pdf as any).putTotalPages?.(totalPagesExp);
  
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
  housekeepingTotal: number = 0,
  language: Language = 'en'
) => {
  const labels = pdfLabels[language];
  const isArabic = language === 'ar';
  
  const pdf = new jsPDF('p', 'mm', 'a4');
  await setupPdfWithFont(pdf, isArabic);
  
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const marginX = 15;
  const totalPagesExp = '{total_pages_count_string}';
  
  // Header
  addPdfHeader(pdf, labels.title, labels.unitPerformance);
  
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
  
  // Summary (Revenue excludes housekeeping; housekeeping is pass-through)
  const summaryRows: Array<[string, string]> = [
    [labels.totalRevenue, formatEGP(totalRevenue)],
  ];
  if (housekeepingTotal > 0) summaryRows.push([labels.housekeeping, formatEGP(housekeepingTotal)]);
  summaryRows.push(
    [labels.totalExpenses, formatEGP(totalExpenses)],
    [labels.netProfit, formatEGP(totalNetProfit)]
  );

  autoTable(pdf, {
    startY: yPos,
    head: [],
    body: (isArabic ? summaryRows.map(([k, v]) => [v, k]) : summaryRows) as any,
    theme: 'grid',
    styles: {
      fontSize: 12,
      cellPadding: 6,
      overflow: 'linebreak',
      halign: isArabic ? 'right' : 'left',
    },
    columnStyles: {
      0: isArabic ? { fontStyle: 'bold', halign: 'right' } : { fontStyle: 'bold', textColor: [100, 100, 100] },
      1: { fontStyle: 'bold', halign: 'right' },
    },
    margin: { left: marginX, right: marginX },
    didParseCell: (data) => {
      if (data.row.index === 0) {
        data.cell.styles.textColor = [22, 163, 74]; // Green for revenue
      } else if (data.row.index === 1) {
        // housekeeping row (neutral)
        data.cell.styles.textColor = [100, 100, 100];
      } else if (data.row.index === 2) {
        data.cell.styles.textColor = [220, 38, 38]; // Red for expenses
      } else if (data.row.index === 2 && data.column.index === 1) {
        data.cell.styles.textColor = totalNetProfit >= 0 ? [22, 163, 74] : [220, 38, 38];
      }
    },
  });
  
  yPos = (pdf as any).lastAutoTable.finalY + 20;
  
  // Units performance table
  const drawHeaderAndFooter = (pageNumber: number) => {
    addPdfHeader(pdf, labels.title, labels.unitPerformance);
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`${labels.generated}: ${new Date().toLocaleDateString(isArabic ? 'ar-EG' : 'en-US')}`, pageWidth / 2, 50, { align: 'center' });
    pdf.text(`${labels.dateRange}: ${dateRange}`, pageWidth / 2, 57, { align: 'center' });

    pdf.setFontSize(10);
    pdf.setTextColor(130, 130, 130);
    pdf.text(`${labels.page} ${pageNumber} ${labels.of} ${totalPagesExp}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  };

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
    theme: 'grid',
    styles: {
      fontSize: 10,
      cellPadding: 5,
      overflow: 'linebreak',
      halign: isArabic ? 'right' : 'left',
    },
    headStyles: {
      fillColor: [245, 245, 245],
      textColor: [40, 40, 40],
      fontStyle: 'bold',
    },
    margin: { left: marginX, right: marginX },
    showHead: 'everyPage',
    didDrawPage: (hookData) => drawHeaderAndFooter(hookData.pageNumber),
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

  (pdf as any).putTotalPages?.(totalPagesExp);

  const pageCount = pdf.getNumberOfPages();
  
  // Footer
  pdf.setPage(pageCount);
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  pdf.text('Sunlight Village Property Management System', pageWidth / 2, pageHeight - 20, { align: 'center' });
  
  pdf.save(`unit-performance-${dateRange.replace(/\s+/g, '-')}.pdf`);
};
