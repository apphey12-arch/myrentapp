/**
 * PDF Translations for Arabic and English
 */

export type PdfLanguage = 'en' | 'ar';

export interface PdfTranslations {
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
  baseRent: string;
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
  
  // Footer
  generatedOn: string;
  thankYou: string;
  paymentInstructions: string;
  whatsApp: string;
  instaPay: string;
}

const translations: Record<PdfLanguage, PdfTranslations> = {
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
    baseRent: 'Base Rent',
    housekeeping: 'Housekeeping',
    grandTotal: 'Grand Total',
    securityDeposit: 'Security Deposit',
    refundable: '(Refundable - Not included in total)',
    
    unitName: 'Unit Name',
    totalRevenue: 'Total Revenue',
    expenses: 'Expenses',
    netProfit: 'Net Profit',
    total: 'Total',
    
    status: 'Status',
    paymentStatus: 'Payment Status',
    
    generatedOn: 'Generated on',
    thankYou: 'Thank you for choosing Sunlight Village!',
    paymentInstructions: 'Payment Instructions',
    whatsApp: 'WhatsApp',
    instaPay: 'InstaPay',
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
    baseRent: 'الإيجار الأساسي',
    housekeeping: 'التنظيف',
    grandTotal: 'المجموع الكلي',
    securityDeposit: 'مبلغ التأمين',
    refundable: '(قابل للاسترداد - غير مضاف للمجموع)',
    
    unitName: 'اسم الوحدة',
    totalRevenue: 'إجمالي الإيرادات',
    expenses: 'المصروفات',
    netProfit: 'صافي الربح',
    total: 'الإجمالي',
    
    status: 'الحالة',
    paymentStatus: 'حالة الدفع',
    
    generatedOn: 'تم الإنشاء في',
    thankYou: 'شكراً لاختياركم صن لايت فيلدج!',
    paymentInstructions: 'تعليمات الدفع',
    whatsApp: 'واتساب',
    instaPay: 'انستاباي',
  },
};

export const getTranslations = (language: PdfLanguage): PdfTranslations => {
  return translations[language];
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-EG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount) + ' EGP';
};

export const formatDate = (dateString: string, language: PdfLanguage): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};
