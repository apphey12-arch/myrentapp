/**
 * PDF-specific translations for Arabic and English
 */

type Language = 'en' | 'ar';

interface PdfTranslations {
  // Header
  brandName: string;
  bookingReceipt: string;
  financialReport: string;
  unitPerformanceReport: string;
  
  // Tenant info
  tenantInformation: string;
  tenantName: string;
  phoneNumber: string;
  
  // Property info
  propertyDetails: string;
  unit: string;
  unitType: string;
  
  // Dates
  bookingDates: string;
  checkIn: string;
  checkOut: string;
  duration: string;
  days: string;
  
  // Financial
  financialBreakdown: string;
  dailyRate: string;
  totalRent: string;
  housekeeping: string;
  grandTotal: string;
  securityDeposit: string;
  refundable: string;
  
  // Report columns
  unitName: string;
  totalRevenue: string;
  expenses: string;
  netProfit: string;
  total: string;
  
  // Status
  status: string;
  paymentStatus: string;
  confirmed: string;
  unconfirmed: string;
  cancelled: string;
  paid: string;
  pending: string;
  overdue: string;
  
  // Footer
  generatedOn: string;
  thankYou: string;
  allRightsReserved: string;
}

const translations: Record<Language, PdfTranslations> = {
  en: {
    brandName: 'Sunlight Village',
    bookingReceipt: 'Booking Receipt',
    financialReport: 'Financial Report',
    unitPerformanceReport: 'Unit Performance Report',
    
    tenantInformation: 'Tenant Information',
    tenantName: 'Tenant Name',
    phoneNumber: 'Phone Number',
    
    propertyDetails: 'Property Details',
    unit: 'Unit',
    unitType: 'Type',
    
    bookingDates: 'Booking Dates',
    checkIn: 'Check-in',
    checkOut: 'Check-out',
    duration: 'Duration',
    days: 'days',
    
    financialBreakdown: 'Financial Breakdown',
    dailyRate: 'Daily Rate',
    totalRent: 'Total Rent',
    housekeeping: 'Housekeeping',
    grandTotal: 'Grand Total',
    securityDeposit: 'Security Deposit',
    refundable: '(Refundable)',
    
    unitName: 'Unit Name',
    totalRevenue: 'Total Revenue',
    expenses: 'Expenses',
    netProfit: 'Net Profit',
    total: 'Total',
    
    status: 'Status',
    paymentStatus: 'Payment Status',
    confirmed: 'Confirmed',
    unconfirmed: 'Unconfirmed',
    cancelled: 'Cancelled',
    paid: 'Paid',
    pending: 'Pending',
    overdue: 'Overdue',
    
    generatedOn: 'Generated on',
    thankYou: 'Thank you for choosing Sunlight Village!',
    allRightsReserved: 'All rights reserved',
  },
  ar: {
    brandName: 'صن لايت فيلدج',
    bookingReceipt: 'إيصال الحجز',
    financialReport: 'التقرير المالي',
    unitPerformanceReport: 'تقرير أداء الوحدات',
    
    tenantInformation: 'معلومات المستأجر',
    tenantName: 'اسم المستأجر',
    phoneNumber: 'رقم الهاتف',
    
    propertyDetails: 'تفاصيل العقار',
    unit: 'الوحدة',
    unitType: 'النوع',
    
    bookingDates: 'تواريخ الحجز',
    checkIn: 'تسجيل الدخول',
    checkOut: 'تسجيل الخروج',
    duration: 'المدة',
    days: 'أيام',
    
    financialBreakdown: 'التفاصيل المالية',
    dailyRate: 'السعر اليومي',
    totalRent: 'إجمالي الإيجار',
    housekeeping: 'التنظيف',
    grandTotal: 'المجموع الكلي',
    securityDeposit: 'مبلغ التأمين',
    refundable: '(قابل للاسترداد)',
    
    unitName: 'اسم الوحدة',
    totalRevenue: 'إجمالي الإيرادات',
    expenses: 'المصروفات',
    netProfit: 'صافي الربح',
    total: 'الإجمالي',
    
    status: 'الحالة',
    paymentStatus: 'حالة الدفع',
    confirmed: 'مؤكد',
    unconfirmed: 'غير مؤكد',
    cancelled: 'ملغي',
    paid: 'مدفوع',
    pending: 'قيد الانتظار',
    overdue: 'متأخر',
    
    generatedOn: 'تم الإنشاء في',
    thankYou: 'شكراً لاختياركم صن لايت فيلدج!',
    allRightsReserved: 'جميع الحقوق محفوظة',
  },
};

/**
 * Get translations for a specific language
 */
export const getPdfTranslations = (language: Language): PdfTranslations => {
  return translations[language];
};

/**
 * Format currency for PDF
 */
export const formatPdfCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-EG', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount) + ' EGP';
};

/**
 * Format date for PDF
 */
export const formatPdfDate = (dateString: string, language: Language): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};
