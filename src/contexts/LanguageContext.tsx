import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'ar';

interface Translations {
  [key: string]: {
    en: string;
    ar: string;
  };
}

export const translations: Translations = {
  // Navigation
  dashboard: { en: 'Dashboard', ar: 'لوحة التحكم' },
  myUnits: { en: 'My Units', ar: 'وحداتي' },
  calendar: { en: 'Calendar', ar: 'التقويم' },
  reports: { en: 'Reports', ar: 'التقارير' },
  expenses: { en: 'Expenses', ar: 'المصروفات' },
  settings: { en: 'Settings', ar: 'الإعدادات' },
  signOut: { en: 'Sign Out', ar: 'تسجيل الخروج' },

  // Common
  save: { en: 'Save', ar: 'حفظ' },
  cancel: { en: 'Cancel', ar: 'إلغاء' },
  delete: { en: 'Delete', ar: 'حذف' },
  edit: { en: 'Edit', ar: 'تعديل' },
  add: { en: 'Add', ar: 'إضافة' },
  search: { en: 'Search', ar: 'بحث' },
  filter: { en: 'Filter', ar: 'تصفية' },
  all: { en: 'All', ar: 'الكل' },
  loading: { en: 'Loading...', ar: 'جاري التحميل...' },
  noData: { en: 'No data found', ar: 'لا توجد بيانات' },

  // Auth
  signIn: { en: 'Sign In', ar: 'تسجيل الدخول' },
  signUp: { en: 'Sign Up', ar: 'إنشاء حساب' },
  email: { en: 'Email', ar: 'البريد الإلكتروني' },
  password: { en: 'Password', ar: 'كلمة المرور' },
  fullName: { en: 'Full Name', ar: 'الاسم الكامل' },
  signInWithGoogle: { en: 'Sign in with Google', ar: 'تسجيل الدخول عبر جوجل' },
  welcomeBack: { en: 'Welcome Back', ar: 'مرحباً بعودتك' },
  createAccount: { en: 'Create Account', ar: 'إنشاء حساب' },

  // Dashboard
  overview: { en: 'Overview of your bookings', ar: 'نظرة عامة على حجوزاتك' },
  addBooking: { en: 'Add Booking', ar: 'إضافة حجز' },
  totalRevenue: { en: 'Total Revenue', ar: 'إجمالي الإيرادات' },
  totalBookings: { en: 'Total Bookings', ar: 'إجمالي الحجوزات' },
  confirmed: { en: 'Confirmed', ar: 'مؤكد' },
  avgDailyRate: { en: 'Avg. Daily Rate', ar: 'متوسط السعر اليومي' },

  // Booking form
  unit: { en: 'Unit', ar: 'الوحدة' },
  tenantName: { en: 'Tenant Name', ar: 'اسم المستأجر' },
  phoneNumber: { en: 'Phone Number', ar: 'رقم الهاتف' },
  startDate: { en: 'Start Date', ar: 'تاريخ البداية' },
  endDate: { en: 'End Date', ar: 'تاريخ النهاية' },
  duration: { en: 'Duration (Days)', ar: 'المدة (أيام)' },
  dailyRate: { en: 'Daily Rate', ar: 'السعر اليومي' },
  totalAmount: { en: 'Total Amount', ar: 'المبلغ الإجمالي' },
  status: { en: 'Status', ar: 'الحالة' },
  paymentStatus: { en: 'Payment Status', ar: 'حالة الدفع' },
  deposit: { en: 'Deposit', ar: 'العربون' },
  housekeeping: { en: 'Housekeeping', ar: 'التنظيف' },
  notes: { en: 'Notes', ar: 'ملاحظات' },
  tenantRating: { en: 'Tenant Rating', ar: 'تقييم المستأجر' },

  // Status options
  unconfirmed: { en: 'Unconfirmed', ar: 'غير مؤكد' },
  cancelled: { en: 'Cancelled', ar: 'ملغي' },
  paid: { en: 'Paid', ar: 'مدفوع' },
  pending: { en: 'Pending', ar: 'قيد الانتظار' },
  overdue: { en: 'Overdue', ar: 'متأخر' },

  // Units
  noUnitsFound: { en: 'No Units Found', ar: 'لم يتم العثور على وحدات' },
  addFirstUnit: { en: 'Add Your First Unit', ar: 'أضف وحدتك الأولى' },
  unitName: { en: 'Unit Name', ar: 'اسم الوحدة' },
  unitType: { en: 'Unit Type', ar: 'نوع الوحدة' },
  villa: { en: 'Villa', ar: 'فيلا' },
  chalet: { en: 'Chalet', ar: 'شاليه' },
  palace: { en: 'Palace', ar: 'قصر' },

  // Settings
  language: { en: 'Language', ar: 'اللغة' },
  theme: { en: 'Theme', ar: 'المظهر' },
  darkMode: { en: 'Dark Mode', ar: 'الوضع الداكن' },
  lightMode: { en: 'Light Mode', ar: 'الوضع الفاتح' },
  english: { en: 'English', ar: 'الإنجليزية' },
  arabic: { en: 'Arabic', ar: 'العربية' },

  // PDF
  printReceipt: { en: 'Print Receipt', ar: 'طباعة الإيصال' },
  bookingReceipt: { en: 'Booking Receipt', ar: 'إيصال الحجز' },
  tenantInformation: { en: 'Tenant Information', ar: 'معلومات المستأجر' },
  propertyDetails: { en: 'Property Details', ar: 'تفاصيل العقار' },

  // Expenses
  addExpense: { en: 'Add Expense', ar: 'إضافة مصروف' },
  description: { en: 'Description', ar: 'الوصف' },
  amount: { en: 'Amount', ar: 'المبلغ' },
  category: { en: 'Category', ar: 'الفئة' },
  expenseDate: { en: 'Date', ar: 'التاريخ' },
  totalExpenses: { en: 'Total Expenses', ar: 'إجمالي المصروفات' },

  // Charts
  revenueVsExpenses: { en: 'Revenue vs Expenses', ar: 'الإيرادات مقابل المصروفات' },
  revenue: { en: 'Revenue', ar: 'الإيرادات' },

  // Filters
  searchByNameOrPhone: { en: 'Search by name or phone...', ar: 'البحث بالاسم أو الهاتف...' },
  filterByUnit: { en: 'Filter by unit', ar: 'تصفية حسب الوحدة' },
  filterByUnitType: { en: 'Filter by unit type', ar: 'تصفية حسب نوع الوحدة' },
  allUnits: { en: 'All Units', ar: 'كل الوحدات' },
  allTypes: { en: 'All Types', ar: 'كل الأنواع' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) return key;
    return translation[language] || key;
  };

  const isRTL = language === 'ar';

  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language, isRTL]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
