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
  return date.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
};

const text = (language: PdfLanguage) => {
  if (language === 'ar') {
    return {
      brand: 'Sunlight Village',
      title: 'تقرير الحجوزات التفصيلي',
      dateRange: 'الفترة',
      unitName: 'الوحدة',
      tenantName: 'اسم المستأجر',
      checkIn: 'الدخول',
      checkOut: 'الخروج',
      price: 'السعر',
      total: 'إجمالي الإيرادات',
    };
  }
  return {
    brand: 'Sunlight Village',
    title: 'Detailed Bookings Report',
    dateRange: 'Date Range',
    unitName: 'Unit Name',
    tenantName: 'Tenant Name',
    checkIn: 'Check-in',
    checkOut: 'Check-out',
    price: 'Price',
    total: 'Total Revenue',
  };
};

export interface BookingsReportOptions {
  bookings: Booking[];
  dateRangeLabel: string;
  totalRevenue: number;
  language: PdfLanguage;
}

export const buildBookingsReportElement = (opts: BookingsReportOptions): HTMLElement => {
  const { bookings, dateRangeLabel, totalRevenue, language } = opts;
  const t = text(language);
  const isAr = language === 'ar';

  const root = document.createElement('div');
  root.style.width = '794px';
  root.style.background = '#ffffff';
  root.style.padding = '40px';
  root.style.boxSizing = 'border-box';
  root.style.color = 'hsl(215 25% 15%)';
  root.style.fontFamily = isAr ? "Cairo, sans-serif" : "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif";
  root.style.direction = isAr ? 'rtl' : 'ltr';
  root.style.textAlign = isAr ? 'right' : 'left';

  // Header
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

  const dateRangeEl = document.createElement('div');
  dateRangeEl.textContent = `${t.dateRange}: ${dateRangeLabel}`;
  dateRangeEl.style.fontSize = '12px';
  dateRangeEl.style.color = 'hsl(215 15% 55%)';
  dateRangeEl.style.marginTop = '4px';

  const divider = document.createElement('div');
  divider.style.height = '2px';
  divider.style.width = '100%';
  divider.style.background = 'hsl(200 85% 45%)';
  divider.style.borderRadius = '2px';
  divider.style.opacity = '0.8';
  divider.style.marginTop = '10px';

  header.appendChild(brand);
  header.appendChild(title);
  header.appendChild(dateRangeEl);
  header.appendChild(divider);
  root.appendChild(header);

  // Table
  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';
  table.style.border = '1px solid hsl(38 25% 88%)';
  table.style.marginTop = '16px';

  // Table header
  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  const headers = [t.unitName, t.tenantName, t.checkIn, t.checkOut, t.price];
  headers.forEach((h) => {
    const th = document.createElement('th');
    th.textContent = h;
    th.style.padding = '10px 8px';
    th.style.fontSize = '11px';
    th.style.fontWeight = '700';
    th.style.color = '#ffffff';
    th.style.background = 'hsl(200 85% 45%)';
    th.style.borderBottom = '1px solid hsl(38 25% 88%)';
    th.style.textAlign = isAr ? 'right' : 'left';
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  table.appendChild(thead);

  // Table body
  const tbody = document.createElement('tbody');
  bookings.forEach((booking, idx) => {
    const tr = document.createElement('tr');
    tr.style.background = idx % 2 === 0 ? 'hsl(45 30% 98%)' : '#ffffff';

    const baseRent = booking.daily_rate * booking.duration_days;

    const cells: Array<[string, 'left' | 'right']> = [
      [booking.unit?.name || '—', isAr ? 'right' : 'left'],
      [booking.tenant_name, isAr ? 'right' : 'left'],
      [formatDate(booking.start_date, language), isAr ? 'right' : 'left'],
      [formatDate(booking.end_date, language), isAr ? 'right' : 'left'],
      [formatMoney(baseRent, language), 'right'],
    ];

    cells.forEach(([val, align]) => {
      const td = document.createElement('td');
      td.textContent = val;
      td.style.padding = '8px';
      td.style.fontSize = '11px';
      td.style.borderBottom = '1px solid hsl(38 25% 88%)';
      td.style.textAlign = align;
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });

  // Totals row
  const totalsRow = document.createElement('tr');
  totalsRow.style.background = 'hsl(200 85% 45%)';
  totalsRow.style.fontWeight = '800';

  const totalLabelCell = document.createElement('td');
  totalLabelCell.textContent = t.total;
  totalLabelCell.colSpan = 4;
  totalLabelCell.style.padding = '12px 8px';
  totalLabelCell.style.color = '#ffffff';
  totalLabelCell.style.fontSize = '12px';
  totalLabelCell.style.textAlign = isAr ? 'right' : 'left';

  const totalValueCell = document.createElement('td');
  totalValueCell.textContent = formatMoney(totalRevenue, language);
  totalValueCell.style.padding = '12px 8px';
  totalValueCell.style.color = '#ffffff';
  totalValueCell.style.fontSize = '12px';
  totalValueCell.style.fontWeight = '800';
  totalValueCell.style.textAlign = 'right';

  totalsRow.appendChild(totalLabelCell);
  totalsRow.appendChild(totalValueCell);
  tbody.appendChild(totalsRow);

  table.appendChild(tbody);
  root.appendChild(table);

  // Record count
  const footer = document.createElement('div');
  footer.style.marginTop = '16px';
  footer.style.fontSize = '11px';
  footer.style.color = 'hsl(215 15% 55%)';
  footer.style.textAlign = 'center';
  footer.textContent = isAr
    ? `عدد الحجوزات: ${bookings.length}`
    : `Total Bookings: ${bookings.length}`;
  root.appendChild(footer);

  return root;
};
