import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatEGP } from './currency';
import { BookingStatus, UnitType, PaymentStatus, getUnitTypeEmoji } from '@/types/database';
import { Language } from '@/contexts/LanguageContext';

import { setupPdfForLanguage } from '@/lib/pdf/runtime-font';

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

// Professional palette (RGB) for PDF rendering
const PDF_COLORS = {
  brand: [14, 38, 74] as const, // dark blue
  brandText: [255, 255, 255] as const,
  headerRule: [220, 220, 220] as const,
  muted: [110, 110, 110] as const,
  text: [30, 30, 30] as const,
  zebra: [248, 248, 248] as const,
} as const;

const PDF_LAYOUT = {
  marginX: 15,
  headerTop: 60,
  footerBottom: 28,
} as const;

const addPdfHeader = (
  pdf: jsPDF,
  opts: {
    title: string;
    subtitle: string;
    metaLines?: string[];
  }
) => {
  const pageWidth = pdf.internal.pageSize.getWidth();

  // Brand bar
  pdf.setFillColor(...PDF_COLORS.brand);
  pdf.rect(0, 0, pageWidth, 32, 'F');

  pdf.setTextColor(...PDF_COLORS.brandText);
  pdf.setFontSize(20);
  pdf.text(opts.title, pageWidth / 2, 14, { align: 'center' });

  pdf.setFontSize(11);
  pdf.text(opts.subtitle, pageWidth / 2, 23, { align: 'center' });

  // Divider + meta
  pdf.setDrawColor(...PDF_COLORS.headerRule);
  pdf.setLineWidth(0.6);
  pdf.line(PDF_LAYOUT.marginX, 38, pageWidth - PDF_LAYOUT.marginX, 38);

  if (opts.metaLines?.length) {
    pdf.setFontSize(10);
    pdf.setTextColor(...PDF_COLORS.muted);
    opts.metaLines.forEach((line, idx) => {
      pdf.text(line, pageWidth / 2, 48 + idx * 6, { align: 'center' });
    });
  }
};

const addPdfFooter = (
  pdf: jsPDF,
  opts: {
    thanksLine: string;
    pageLine: string;
  }
) => {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  pdf.setDrawColor(...PDF_COLORS.headerRule);
  pdf.setLineWidth(0.6);
  pdf.line(PDF_LAYOUT.marginX, pageHeight - 25, pageWidth - PDF_LAYOUT.marginX, pageHeight - 25);

  pdf.setFontSize(10);
  pdf.setTextColor(...PDF_COLORS.muted);
  pdf.text(opts.thanksLine, pageWidth / 2, pageHeight - 15, { align: 'center' });
  pdf.text(opts.pageLine, pageWidth / 2, pageHeight - 10, { align: 'center' });
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
  const pdf = new jsPDF('p', 'mm', 'a4');
  const setup = await setupPdfForLanguage(pdf, language);
  const tt = setup.t;
  const rtl = setup.isArabic;
  
  const baseAmount = data.dailyRate * data.durationDays;
  const housekeepingAmount = data.housekeepingAmount || 0;
  const totalRent = baseAmount; // Total Rent is Base Rent ONLY
  const grandTotal = baseAmount + housekeepingAmount;
  
  const pageWidth = pdf.internal.pageSize.getWidth();
  const marginX = PDF_LAYOUT.marginX;
  
  // Header
  addPdfHeader(pdf, {
    title: tt(labels.title),
    subtitle: tt(labels.subtitle),
    metaLines: [
      `${tt(labels.date)}: ${new Date().toLocaleDateString(rtl ? 'ar-EG' : 'en-US')}`,
    ],
  });
  
  let yPos = PDF_LAYOUT.headerTop;

  const kvRows = (rows: Array<[string, string]>) =>
    rtl ? rows.map(([k, v]) => [v, k]) : rows;

  const kvColumnStyles = rtl
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
          content: tt(labels.tenantInfo),
          colSpan: 2,
          styles: {
            fillColor: PDF_COLORS.brand as any,
            textColor: PDF_COLORS.brandText as any,
            fontStyle: 'bold',
            halign: rtl ? 'right' : 'left',
          },
        },
      ],
    ] as any,
    body: kvRows([
      [tt(labels.name), tt(data.tenantName)],
      [tt(labels.phone), tt(data.phoneNumber || '—')],
      [tt(labels.status), tt(data.status)],
      [tt(labels.payment), tt(data.paymentStatus || 'Pending')],
    ]),
    theme: 'grid',
    styles: {
      font: rtl ? 'Cairo' : 'helvetica',
      fontSize: 11,
      cellPadding: 4,
      overflow: 'linebreak',
      halign: rtl ? 'right' : 'left',
    },
    headStyles: {
      fillColor: PDF_COLORS.brand as any,
      textColor: PDF_COLORS.brandText as any,
      fontStyle: 'bold',
    },
    alternateRowStyles: { fillColor: PDF_COLORS.zebra as any },
    columnStyles: kvColumnStyles as any,
    margin: { left: marginX, right: marginX, top: PDF_LAYOUT.headerTop, bottom: PDF_LAYOUT.footerBottom },
  });
  
  yPos = (pdf as any).lastAutoTable.finalY + 12;
  
  // Unit Details
  autoTable(pdf, {
    startY: yPos,
    head: [
      [
        {
          content: tt(labels.propertyDetails),
          colSpan: 2,
          styles: {
            fillColor: PDF_COLORS.brand as any,
            textColor: PDF_COLORS.brandText as any,
            fontStyle: 'bold',
            halign: rtl ? 'right' : 'left',
          },
        },
      ],
    ] as any,
    body: kvRows([
      [tt(labels.unit), tt(`${getUnitTypeEmoji(data.unitType)} ${data.unitName}`)],
      [tt(labels.type), tt(data.unitType)],
      [tt(labels.checkIn), tt(data.startDate)],
      [tt(labels.checkOut), tt(data.endDate)],
      [tt(labels.duration), tt(`${data.durationDays} ${labels.days}`)],
    ]),
    theme: 'grid',
    styles: {
      font: rtl ? 'Cairo' : 'helvetica',
      fontSize: 11,
      cellPadding: 4,
      overflow: 'linebreak',
      halign: rtl ? 'right' : 'left',
    },
    headStyles: {
      fillColor: PDF_COLORS.brand as any,
      textColor: PDF_COLORS.brandText as any,
      fontStyle: 'bold',
    },
    alternateRowStyles: { fillColor: PDF_COLORS.zebra as any },
    columnStyles: kvColumnStyles as any,
    margin: { left: marginX, right: marginX, top: PDF_LAYOUT.headerTop, bottom: PDF_LAYOUT.footerBottom },
  });
  
  yPos = (pdf as any).lastAutoTable.finalY + 12;
  
  const pricingRows: Array<[string, string]> = [
    [`${tt(labels.baseAmount)}`, formatEGP(baseAmount)],
  ];
  if (housekeepingAmount > 0) pricingRows.push([tt(labels.housekeeping), formatEGP(housekeepingAmount)]);

  // Total Rent = Base Rent only
  pricingRows.push([tt(labels.totalRent), formatEGP(totalRent)]);
  // Grand Total = Base + Housekeeping
  pricingRows.push([tt(labels.grandTotal), formatEGP(grandTotal)]);

  if (data.depositAmount && data.depositAmount > 0) {
    pricingRows.push([`${tt(labels.refundableDeposit)} *`, formatEGP(data.depositAmount)]);
  }

  const pricingHead = rtl
    ? ([
        [
          {
            content: tt(labels.pricing),
            colSpan: 2,
            styles: {
              fillColor: PDF_COLORS.brand as any,
              textColor: PDF_COLORS.brandText as any,
              fontStyle: 'bold',
              halign: 'right',
            },
          },
        ],
        [tt(labels.amount), tt(labels.description)],
      ] as any)
    : ([
        [
          {
            content: tt(labels.pricing),
            colSpan: 2,
            styles: {
              fillColor: PDF_COLORS.brand as any,
              textColor: PDF_COLORS.brandText as any,
              fontStyle: 'bold',
              halign: 'left',
            },
          },
        ],
        [tt(labels.description), tt(labels.amount)],
      ] as any);

  const pricingBody = (rtl
    ? pricingRows.map(([k, v]) => [v, k])
    : pricingRows.map(([k, v]) => [k, v])) as any;

  const pricingColumnStyles = rtl
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
      font: rtl ? 'Cairo' : 'helvetica',
      fontSize: 11,
      cellPadding: 5,
      overflow: 'linebreak',
      halign: rtl ? 'right' : 'left',
    },
    headStyles: {
      fillColor: PDF_COLORS.brand as any,
      textColor: PDF_COLORS.brandText as any,
      fontStyle: 'bold',
    },
    alternateRowStyles: { fillColor: PDF_COLORS.zebra as any },
    columnStyles: pricingColumnStyles as any,
    margin: { left: marginX, right: marginX, top: PDF_LAYOUT.headerTop, bottom: PDF_LAYOUT.footerBottom },
    didParseCell: (data) => {
      const raw0 = (data.row.raw as any)?.[0] as string | undefined;
      const raw1 = (data.row.raw as any)?.[1] as string | undefined;
      const labelCell = rtl ? raw1 : raw0;

      // Highlight Total Rent and Grand Total rows
      if (labelCell?.includes(labels.totalRent) || labelCell?.includes(labels.grandTotal)) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = PDF_COLORS.zebra as any;
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
    pdf.setTextColor(...PDF_COLORS.muted);
    pdf.text(tt(labels.depositNote), rtl ? pageWidth - marginX : marginX, yPos, { align: rtl ? 'right' : 'left' });
  }

  // Footer + page numbers on every page
  const pageHeight = pdf.internal.pageSize.getHeight();
  const totalPages = pdf.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    pdf.setPage(p);
    addPdfFooter(pdf, {
      thanksLine: tt(labels.thanks),
      pageLine: `${tt(labels.page)} ${p} ${tt(labels.of)} ${totalPages}`,
    });
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
  const pdf = new jsPDF('p', 'mm', 'a4');
  const { isArabic, t } = await setupPdfForLanguage(pdf, language);
  
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const marginX = PDF_LAYOUT.marginX;
  const totalPagesExp = '{total_pages_count_string}';

  // Header
  addPdfHeader(pdf, {
    title: t(labels.title),
    subtitle: t(labels.reportTitle),
    metaLines: [
      `${t(labels.generated)}: ${new Date().toLocaleDateString(isArabic ? 'ar-EG' : 'en-US')}`,
      `${t(labels.dateRange)}: ${data.dateRange} | ${t(labels.scope)}: ${data.unitScope}`,
    ],
  });

  let yPos = PDF_LAYOUT.headerTop + 10;
  
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
    alternateRowStyles: { fillColor: PDF_COLORS.zebra as any },
    margin: { left: marginX, right: marginX, top: PDF_LAYOUT.headerTop, bottom: PDF_LAYOUT.footerBottom },
  });
  
  yPos = (pdf as any).lastAutoTable.finalY + 15;
  
  // Bookings table with auto-pagination
  const drawHeaderAndFooter = (pageNumber: number) => {
    addPdfHeader(pdf, {
      title: t(labels.title),
      subtitle: t(labels.reportTitle),
      metaLines: [
        `${t(labels.generated)}: ${new Date().toLocaleDateString(isArabic ? 'ar-EG' : 'en-US')}`,
        `${t(labels.dateRange)}: ${data.dateRange} | ${t(labels.scope)}: ${data.unitScope}`,
      ],
    });

    addPdfFooter(pdf, {
      thanksLine: t(labels.thanks),
      pageLine: `${t(labels.page)} ${pageNumber} ${t(labels.of)} ${totalPagesExp}`,
    });
  };

  pdf.setFontSize(14);
  pdf.setTextColor(...PDF_COLORS.text);
  pdf.text(t(labels.totalBookings), isArabic ? pageWidth - marginX : marginX, yPos, { align: isArabic ? 'right' : 'left' });
  yPos += 8;

  const headEn = [t(labels.unit), t(labels.tenant), t(labels.dates), t(labels.amount), t(labels.status), t(labels.payment)];
  const headRow = isArabic ? [...headEn].reverse() : headEn;
  
  autoTable(pdf, {
    startY: yPos,
    head: [
      headRow,
    ],
    body: data.bookings.map((b) => {
      const row = [t(b.unitName), t(b.tenantName), t(b.dates), formatEGP(b.amount), t(b.status), t(b.paymentStatus)];
      return isArabic ? row.reverse() : row;
    }),
    theme: 'grid',
    styles: {
      font: isArabic ? 'Cairo' : 'helvetica',
      fontSize: 9,
      cellPadding: 4,
      overflow: 'linebreak',
      halign: isArabic ? 'right' : 'left',
    },
    headStyles: {
      fillColor: PDF_COLORS.brand as any,
      textColor: PDF_COLORS.brandText as any,
      fontStyle: 'bold',
    },
    alternateRowStyles: { fillColor: PDF_COLORS.zebra as any },
    margin: { left: marginX, right: marginX, top: PDF_LAYOUT.headerTop, bottom: PDF_LAYOUT.footerBottom },
    // Auto-pagination: this will automatically create new pages
    showHead: 'everyPage',
    didDrawPage: (hookData) => drawHeaderAndFooter(hookData.pageNumber),
  });

  // Replace total pages placeholder
  (pdf as any).putTotalPages?.(totalPagesExp);
  
  // Footer on last page (brand system line)
  const lastPage = pdf.getNumberOfPages();
  pdf.setPage(lastPage);
  pdf.setFontSize(10);
  pdf.setTextColor(...PDF_COLORS.muted);
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
  const pdf = new jsPDF('p', 'mm', 'a4');
  const { isArabic, t } = await setupPdfForLanguage(pdf, language);
  
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const marginX = PDF_LAYOUT.marginX;
  const totalPagesExp = '{total_pages_count_string}';
  
  // Header
  addPdfHeader(pdf, {
    title: t(labels.title),
    subtitle: t(labels.unitPerformance),
    metaLines: [
      `${t(labels.generated)}: ${new Date().toLocaleDateString(isArabic ? 'ar-EG' : 'en-US')}`,
      `${t(labels.dateRange)}: ${dateRange}`,
    ],
  });
  
  let yPos = PDF_LAYOUT.headerTop + 10;
  
  // Calculate totals
  const totalRevenue = units.reduce((sum, u) => sum + u.totalRevenue, 0);
  const totalExpenses = units.reduce((sum, u) => sum + u.totalExpenses, 0);
  const totalNetProfit = totalRevenue - totalExpenses;
  
  // Summary (Revenue excludes housekeeping; housekeeping is pass-through)
  const summaryRows: Array<[string, string]> = [[t(labels.totalRevenue), formatEGP(totalRevenue)]];
  if (housekeepingTotal > 0) summaryRows.push([t(labels.housekeeping), formatEGP(housekeepingTotal)]);
  summaryRows.push(
    [t(labels.totalExpenses), formatEGP(totalExpenses)],
    [t(labels.netProfit), formatEGP(totalNetProfit)]
  );

  autoTable(pdf, {
    startY: yPos,
    head: [],
    body: (isArabic ? summaryRows.map(([k, v]) => [v, k]) : summaryRows) as any,
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
      1: { fontStyle: 'bold', halign: 'right' },
    },
    alternateRowStyles: { fillColor: PDF_COLORS.zebra as any },
    margin: { left: marginX, right: marginX, top: PDF_LAYOUT.headerTop, bottom: PDF_LAYOUT.footerBottom },
    didParseCell: (data) => {
      if (data.row.index === 0) {
        data.cell.styles.textColor = [22, 163, 74]; // Green for revenue
      } else if (data.row.index === 1) {
        // housekeeping row (neutral)
        data.cell.styles.textColor = [100, 100, 100];
      } else if (data.row.index === 2) {
        data.cell.styles.textColor = [220, 38, 38]; // Red for expenses
      } else if (data.row.index === 3) {
        // Net profit row
        data.cell.styles.textColor = totalNetProfit >= 0 ? [22, 163, 74] : [220, 38, 38];
      }
    },
  });
  
  yPos = (pdf as any).lastAutoTable.finalY + 20;
  
  // Units performance table
  const drawHeaderAndFooter = (pageNumber: number) => {
    addPdfHeader(pdf, {
      title: t(labels.title),
      subtitle: t(labels.unitPerformance),
      metaLines: [
        `${t(labels.generated)}: ${new Date().toLocaleDateString(isArabic ? 'ar-EG' : 'en-US')}`,
        `${t(labels.dateRange)}: ${dateRange}`,
      ],
    });

    addPdfFooter(pdf, {
      thanksLine: t(labels.thanks),
      pageLine: `${t(labels.page)} ${pageNumber} ${t(labels.of)} ${totalPagesExp}`,
    });
  };

  const unitHeadEn = [t(labels.unit), t(labels.type), t(labels.totalRevenue), t(labels.totalExpenses), t(labels.netProfit)];
  const unitHeadRow = isArabic ? [...unitHeadEn].reverse() : unitHeadEn;

  autoTable(pdf, {
    startY: yPos,
    head: [unitHeadRow],
    body: units.map((u) => {
      const row = [
        t(`${getUnitTypeEmoji(u.unitType)} ${u.unitName}`),
        t(u.unitType),
        formatEGP(u.totalRevenue),
        formatEGP(u.totalExpenses),
        formatEGP(u.netProfit),
      ];
      return isArabic ? row.reverse() : row;
    }),
    theme: 'grid',
    styles: {
      font: isArabic ? 'Cairo' : 'helvetica',
      fontSize: 10,
      cellPadding: 5,
      overflow: 'linebreak',
      halign: isArabic ? 'right' : 'left',
    },
    headStyles: {
      fillColor: PDF_COLORS.brand as any,
      textColor: PDF_COLORS.brandText as any,
      fontStyle: 'bold',
    },
    alternateRowStyles: { fillColor: PDF_COLORS.zebra as any },
    margin: { left: marginX, right: marginX, top: PDF_LAYOUT.headerTop, bottom: PDF_LAYOUT.footerBottom },
    showHead: 'everyPage',
    didDrawPage: (hookData) => drawHeaderAndFooter(hookData.pageNumber),
    didParseCell: (data) => {
      // Color net profit column
      const profitColumnIndex = isArabic ? 0 : 4;
      if (data.column.index === profitColumnIndex && data.section === 'body') {
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
  pdf.setTextColor(...PDF_COLORS.muted);
  pdf.text('Sunlight Village Property Management System', pageWidth / 2, pageHeight - 20, { align: 'center' });
  
  pdf.save(`unit-performance-${dateRange.replace(/\s+/g, '-')}.pdf`);
};
