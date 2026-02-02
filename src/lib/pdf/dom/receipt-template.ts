import type { Booking } from '@/types/database';
import type { PdfLanguage } from '../translations';

const formatMoney = (amount: number, language: PdfLanguage): string => {
  const locale = language === 'ar' ? 'ar-EG' : 'en-EG';
  return (
    new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount) +
    ' EGP'
  );
};

const formatDate = (dateString: string, language: PdfLanguage): string => {
  const locale = language === 'ar' ? 'ar-EG' : 'en-US';
  const date = new Date(dateString);
  return date.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
};

const text = (language: PdfLanguage) => {
  if (language === 'ar') {
    return {
      brand: 'Sunlight Village',
      title: 'إيصال الحجز',
      tenant: 'بيانات المستأجر',
      unit: 'بيانات الوحدة',
      pricing: 'التفاصيل المالية',
      tenantName: 'اسم المستأجر',
      phone: 'رقم الهاتف',
      unitName: 'الوحدة',
      unitType: 'النوع',
      checkIn: 'تاريخ الدخول',
      checkOut: 'تاريخ الخروج',
      days: 'عدد الأيام',
      dailyRate: 'السعر اليومي',
      baseRent: 'الإيجار الأساسي',
      housekeeping: 'التنظيف',
      total: 'الإجمالي',
      refundableDeposit: 'تأمين قابل للاسترداد',
    };
  }

  return {
    brand: 'Sunlight Village',
    title: 'Booking Receipt',
    tenant: 'Tenant Details',
    unit: 'Unit Details',
    pricing: 'Financials',
    tenantName: 'Tenant Name',
    phone: 'Phone Number',
    unitName: 'Unit',
    unitType: 'Type',
    checkIn: 'Check-in',
    checkOut: 'Check-out',
    days: 'Days',
    dailyRate: 'Daily Price',
    baseRent: 'Base Rent',
    housekeeping: 'Housekeeping',
    total: 'Total',
    refundableDeposit: 'Refundable Deposit',
  };
};

const createSectionTitle = (label: string) => {
  const h = document.createElement('h2');
  h.textContent = label;
  h.style.fontSize = '14px';
  h.style.margin = '18px 0 8px';
  h.style.fontWeight = '700';
  h.style.color = 'hsl(215 25% 15%)';
  return h;
};

const createKeyValueTable = (rows: Array<[string, string]>, language: PdfLanguage) => {
  const tbl = document.createElement('table');
  tbl.style.width = '100%';
  tbl.style.borderCollapse = 'collapse';
  tbl.style.border = '1px solid hsl(38 25% 88%)';

  rows.forEach(([k, v], idx) => {
    const tr = document.createElement('tr');
    tr.style.background = idx % 2 === 0 ? 'hsl(45 30% 98%)' : '#ffffff';

    const tdK = document.createElement('td');
    tdK.textContent = k;
    tdK.style.padding = '10px';
    tdK.style.width = '38%';
    tdK.style.fontWeight = '600';
    tdK.style.color = 'hsl(215 15% 45%)';
    tdK.style.borderBottom = '1px solid hsl(38 25% 88%)';

    const tdV = document.createElement('td');
    tdV.textContent = v;
    tdV.style.padding = '10px';
    tdV.style.color = 'hsl(215 25% 15%)';
    tdV.style.borderBottom = '1px solid hsl(38 25% 88%)';

    if (language === 'ar') {
      tdK.style.textAlign = 'right';
      tdV.style.textAlign = 'right';
    } else {
      tdK.style.textAlign = 'left';
      tdV.style.textAlign = 'left';
    }

    tr.appendChild(tdK);
    tr.appendChild(tdV);
    tbl.appendChild(tr);
  });

  // Remove last borderBottom for cleaner look
  const lastRow = tbl.lastElementChild as HTMLTableRowElement | null;
  if (lastRow) {
    Array.from(lastRow.children).forEach((td) => {
      (td as HTMLElement).style.borderBottom = 'none';
    });
  }

  return tbl;
};

export const buildBookingReceiptElement = (booking: Booking, language: PdfLanguage): HTMLElement => {
  const t = text(language);
  const isAr = language === 'ar';

  // Financial logic (matches app behavior)
  const baseRent = booking.daily_rate * booking.duration_days;
  const housekeeping = booking.housekeeping_amount || 0;
  const total = baseRent + housekeeping;
  const deposit = booking.deposit_amount || 0;

  const root = document.createElement('div');
  root.style.width = '794px'; // stable A4-ish width for html2canvas
  root.style.background = '#ffffff';
  root.style.padding = '40px';
  root.style.boxSizing = 'border-box';
  root.style.color = 'hsl(215 25% 15%)';
  root.style.fontFamily = isAr ? "Cairo, sans-serif" : "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif";
  root.style.direction = isAr ? 'rtl' : 'ltr';
  root.style.textAlign = isAr ? 'right' : 'left';

  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.flexDirection = 'column';
  header.style.gap = '6px';
  header.style.alignItems = 'center';
  header.style.marginBottom = '18px';

  const brand = document.createElement('div');
  brand.textContent = t.brand;
  brand.style.fontSize = '26px';
  brand.style.fontWeight = '800';
  brand.style.color = 'hsl(200 85% 45%)';

  const title = document.createElement('div');
  title.textContent = t.title;
  title.style.fontSize = '14px';
  title.style.fontWeight = '600';
  title.style.color = 'hsl(215 15% 45%)';

  const divider = document.createElement('div');
  divider.style.height = '2px';
  divider.style.width = '100%';
  divider.style.background = 'hsl(200 85% 45%)';
  divider.style.borderRadius = '2px';
  divider.style.opacity = '0.8';
  divider.style.marginTop = '10px';

  header.appendChild(brand);
  header.appendChild(title);
  header.appendChild(divider);
  root.appendChild(header);

  // Tenant
  root.appendChild(createSectionTitle(t.tenant));
  root.appendChild(
    createKeyValueTable(
      [
        [t.tenantName, booking.tenant_name],
        [t.phone, booking.phone_number || '—'],
      ],
      language
    )
  );

  // Unit
  root.appendChild(createSectionTitle(t.unit));
  root.appendChild(
    createKeyValueTable(
      [
        [t.unitName, booking.unit?.name || '—'],
        [t.unitType, booking.unit?.type || '—'],
        [t.checkIn, formatDate(booking.start_date, language)],
        [t.checkOut, formatDate(booking.end_date, language)],
        [t.days, String(booking.duration_days)],
      ],
      language
    )
  );

  // Pricing
  root.appendChild(createSectionTitle(t.pricing));
  root.appendChild(
    createKeyValueTable(
      [
        [t.dailyRate, formatMoney(booking.daily_rate, language)],
        [t.baseRent, formatMoney(baseRent, language)],
        [t.housekeeping, formatMoney(housekeeping, language)],
        [t.total, formatMoney(total, language)],
      ],
      language
    )
  );

  if (deposit > 0) {
    const depositBox = document.createElement('div');
    depositBox.style.marginTop = '12px';
    depositBox.style.border = '1px dashed hsl(38 92% 55%)';
    depositBox.style.background = 'hsl(38 20% 94%)';
    depositBox.style.borderRadius = '10px';
    depositBox.style.padding = '10px 12px';

    const depositRow = document.createElement('div');
    depositRow.style.display = 'flex';
    depositRow.style.justifyContent = 'space-between';
    depositRow.style.gap = '12px';
    depositRow.style.flexDirection = isAr ? 'row-reverse' : 'row';

    const dLabel = document.createElement('div');
    dLabel.textContent = t.refundableDeposit;
    dLabel.style.fontWeight = '700';
    dLabel.style.color = 'hsl(38 80% 15%)';

    const dValue = document.createElement('div');
    dValue.textContent = formatMoney(deposit, language);
    dValue.style.fontWeight = '800';
    dValue.style.color = 'hsl(38 80% 15%)';

    depositRow.appendChild(dLabel);
    depositRow.appendChild(dValue);
    depositBox.appendChild(depositRow);
    root.appendChild(depositBox);
  }

  return root;
};
