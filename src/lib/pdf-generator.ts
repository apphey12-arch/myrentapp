import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { formatEGP } from './currency';
import { BookingStatus, UnitType, PaymentStatus, getUnitTypeEmoji } from '@/types/database';
import { Language } from '@/contexts/LanguageContext';

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
  },
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

// Create a hidden container for PDF rendering with proper Arabic font
const createPdfContainer = (isArabic: boolean): HTMLDivElement => {
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    left: -9999px;
    top: 0;
    width: 595px;
    padding: 40px;
    background: white;
    font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif;
    direction: ${isArabic ? 'rtl' : 'ltr'};
    text-align: ${isArabic ? 'right' : 'left'};
    color: #1a1a1a;
    font-size: 12px;
    line-height: 1.5;
  `;
  document.body.appendChild(container);
  return container;
};

// Generate PDF from HTML element using html2canvas
const generatePdfFromElement = async (element: HTMLElement, filename: string) => {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  });
  
  const pdf = new jsPDF('p', 'mm', 'a4');
  const imgData = canvas.toDataURL('image/png');
  const imgWidth = 190;
  const pageHeight = 277;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
  let heightLeft = imgHeight;
  let position = 10;
  
  pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;
  
  // Handle multi-page PDFs
  while (heightLeft > 0) {
    position = heightLeft - imgHeight + 10;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }
  
  pdf.save(filename);
};

export const generateBookingPDF = async (data: BookingReceiptData, language: Language = 'en') => {
  const labels = pdfLabels[language];
  const isArabic = language === 'ar';
  
  const baseAmount = data.dailyRate * data.durationDays;
  const housekeepingAmount = data.housekeepingAmount || 0;
  const totalRent = baseAmount + housekeepingAmount;
  
  const container = createPdfContainer(isArabic);
  
  container.innerHTML = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
      * { font-family: 'Cairo', sans-serif !important; box-sizing: border-box; margin: 0; padding: 0; }
      .header { background: linear-gradient(135deg, #0e7490 0%, #0891b2 100%); color: white; padding: 30px; margin: -40px -40px 30px -40px; text-align: center; }
      .header h1 { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
      .header p { font-size: 14px; opacity: 0.9; }
      .date-badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 6px 16px; border-radius: 20px; margin-top: 12px; font-size: 12px; }
      .section { margin-bottom: 24px; }
      .section-title { font-size: 14px; font-weight: 700; color: #0e7490; border-bottom: 2px solid #0e7490; padding-bottom: 8px; margin-bottom: 16px; }
      .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      .info-item { background: #f8fafc; padding: 12px 16px; border-radius: 8px; border-${isArabic ? 'right' : 'left'}: 3px solid #0e7490; }
      .info-item label { font-size: 10px; color: #64748b; display: block; margin-bottom: 4px; }
      .info-item span { font-size: 14px; font-weight: 600; color: #1e293b; }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; }
      th { background: #0e7490; color: white; padding: 12px 16px; font-size: 12px; font-weight: 600; text-align: ${isArabic ? 'right' : 'left'}; }
      td { padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
      tr:nth-child(even) { background: #f8fafc; }
      .total-row { background: #fef3c7 !important; }
      .total-row td { font-weight: 700; font-size: 14px; color: #92400e; }
      .deposit-row td { font-style: italic; color: #64748b; }
      .note { font-size: 10px; color: #64748b; margin-top: 12px; padding: 10px; background: #f1f5f9; border-radius: 6px; }
      .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
      .footer p { color: #64748b; font-size: 11px; }
      .status-badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 600; }
      .status-confirmed { background: #dcfce7; color: #166534; }
      .status-unconfirmed { background: #fef3c7; color: #92400e; }
      .status-cancelled { background: #fee2e2; color: #991b1b; }
      .payment-paid { background: #dcfce7; color: #166534; }
      .payment-pending { background: #fef3c7; color: #92400e; }
      .payment-overdue { background: #fee2e2; color: #991b1b; }
    </style>
    
    <div class="header">
      <h1>${labels.title}</h1>
      <p>${labels.subtitle}</p>
      <div class="date-badge">${labels.date}: ${new Date().toLocaleDateString(isArabic ? 'ar-EG' : 'en-US')}</div>
    </div>
    
    <div class="section">
      <div class="section-title">${labels.tenantInfo}</div>
      <div class="info-grid">
        <div class="info-item">
          <label>${labels.name}</label>
          <span>${data.tenantName}</span>
        </div>
        <div class="info-item">
          <label>${labels.phone}</label>
          <span>${data.phoneNumber || 'N/A'}</span>
        </div>
        <div class="info-item">
          <label>${labels.status}</label>
          <span class="status-badge status-${data.status.toLowerCase()}">${data.status}</span>
        </div>
        <div class="info-item">
          <label>${labels.payment}</label>
          <span class="status-badge payment-${(data.paymentStatus || 'pending').toLowerCase()}">${data.paymentStatus || 'N/A'}</span>
        </div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">${labels.propertyDetails}</div>
      <div class="info-grid">
        <div class="info-item">
          <label>${labels.unit}</label>
          <span>${getUnitTypeEmoji(data.unitType)} ${data.unitName}</span>
        </div>
        <div class="info-item">
          <label>${labels.type}</label>
          <span>${data.unitType}</span>
        </div>
        <div class="info-item">
          <label>${labels.checkIn}</label>
          <span>${data.startDate}</span>
        </div>
        <div class="info-item">
          <label>${labels.checkOut}</label>
          <span>${data.endDate}</span>
        </div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">${labels.pricing}</div>
      <table>
        <thead>
          <tr>
            <th>${labels.description}</th>
            <th>${labels.amount}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${labels.dailyRate} × ${data.durationDays} ${labels.days}</td>
            <td>${formatEGP(baseAmount)}</td>
          </tr>
          ${housekeepingAmount > 0 ? `
          <tr>
            <td>${labels.housekeeping}</td>
            <td>${formatEGP(housekeepingAmount)}</td>
          </tr>
          ` : ''}
          <tr class="total-row">
            <td>${labels.totalRent}</td>
            <td>${formatEGP(totalRent)}</td>
          </tr>
          ${data.depositAmount && data.depositAmount > 0 ? `
          <tr class="deposit-row">
            <td>${labels.refundableDeposit} *</td>
            <td>${formatEGP(data.depositAmount)}</td>
          </tr>
          ` : ''}
        </tbody>
      </table>
      ${data.depositAmount && data.depositAmount > 0 ? `
      <div class="note">${labels.depositNote}</div>
      ` : ''}
    </div>
    
    <div class="footer">
      <p>${labels.thanks}</p>
    </div>
  `;
  
  try {
    await generatePdfFromElement(container, `booking-receipt-${data.tenantName.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-') || 'booking'}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
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
  
  const container = createPdfContainer(isArabic);
  
  const bookingsHtml = data.bookings.map(b => `
    <tr>
      <td>${b.unitName}</td>
      <td>${b.tenantName}</td>
      <td>${b.dates}</td>
      <td>${formatEGP(b.amount)}</td>
      <td>${b.status}</td>
      <td>${b.paymentStatus}</td>
    </tr>
  `).join('');
  
  container.innerHTML = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
      * { font-family: 'Cairo', sans-serif !important; box-sizing: border-box; margin: 0; padding: 0; }
      .header { background: linear-gradient(135deg, #0e7490 0%, #0891b2 100%); color: white; padding: 30px; margin: -40px -40px 30px -40px; text-align: center; }
      .header h1 { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
      .header p { font-size: 14px; opacity: 0.9; }
      .date-badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 6px 16px; border-radius: 20px; margin-top: 12px; font-size: 12px; }
      .filters { display: flex; gap: 20px; margin-bottom: 24px; flex-wrap: wrap; }
      .filter-item { background: #f1f5f9; padding: 10px 16px; border-radius: 8px; }
      .filter-item label { font-size: 10px; color: #64748b; display: block; }
      .filter-item span { font-size: 12px; font-weight: 600; }
      .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 30px; }
      .stat-card { background: #f8fafc; border-radius: 12px; padding: 20px; text-align: center; border: 1px solid #e2e8f0; }
      .stat-card label { font-size: 10px; color: #64748b; display: block; margin-bottom: 8px; text-transform: uppercase; }
      .stat-card .value { font-size: 20px; font-weight: 700; }
      .stat-card.revenue .value { color: #0e7490; }
      .stat-card.expenses .value { color: #dc2626; }
      .stat-card.profit .value { color: ${data.netIncome >= 0 ? '#16a34a' : '#dc2626'}; }
      .section-title { font-size: 14px; font-weight: 700; color: #0e7490; border-bottom: 2px solid #0e7490; padding-bottom: 8px; margin-bottom: 16px; }
      table { width: 100%; border-collapse: collapse; font-size: 10px; }
      th { background: #0e7490; color: white; padding: 10px 12px; font-weight: 600; text-align: ${isArabic ? 'right' : 'left'}; }
      td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; }
      tr:nth-child(even) { background: #f8fafc; }
      .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
      .footer p { color: #64748b; font-size: 11px; }
    </style>
    
    <div class="header">
      <h1>${labels.title}</h1>
      <p>${labels.reportTitle}</p>
      <div class="date-badge">${labels.generated}: ${new Date().toLocaleDateString(isArabic ? 'ar-EG' : 'en-US')}</div>
    </div>
    
    <div class="filters">
      <div class="filter-item">
        <label>${labels.dateRange}</label>
        <span>${data.dateRange}</span>
      </div>
      <div class="filter-item">
        <label>${labels.scope}</label>
        <span>${data.unitScope}</span>
      </div>
    </div>
    
    <div class="stats-grid">
      <div class="stat-card revenue">
        <label>${labels.totalRevenue}</label>
        <div class="value">${formatEGP(data.totalRevenue)}</div>
      </div>
      <div class="stat-card expenses">
        <label>${labels.totalExpenses}</label>
        <div class="value">${formatEGP(data.totalExpenses)}</div>
      </div>
      <div class="stat-card profit">
        <label>${labels.netIncome}</label>
        <div class="value">${data.netIncome >= 0 ? '+' : ''}${formatEGP(data.netIncome)}</div>
      </div>
      <div class="stat-card">
        <label>${labels.totalBookings}</label>
        <div class="value">${data.totalBookings}</div>
      </div>
      <div class="stat-card">
        <label>${labels.occupiedDays}</label>
        <div class="value">${data.occupiedDays} ${labels.days}</div>
      </div>
      <div class="stat-card">
        <label>${labels.avgDailyRate}</label>
        <div class="value">${formatEGP(data.averageDailyRate)}</div>
      </div>
    </div>
    
    <div class="section-title">${labels.totalBookings}</div>
    <table>
      <thead>
        <tr>
          <th>${labels.unit}</th>
          <th>${labels.tenant}</th>
          <th>${labels.dates}</th>
          <th>${labels.amount}</th>
          <th>${labels.status}</th>
          <th>${labels.payment}</th>
        </tr>
      </thead>
      <tbody>
        ${bookingsHtml}
      </tbody>
    </table>
    
    <div class="footer">
      <p>Sunlight Village Property Management System</p>
    </div>
  `;
  
  try {
    await generatePdfFromElement(container, `report-${data.dateRange.replace(/\s+/g, '-')}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
};
