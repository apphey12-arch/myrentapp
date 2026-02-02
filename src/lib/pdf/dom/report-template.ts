import type { PdfLanguage } from '../translations';
import type { UnitPerformanceData } from '../types';

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

const text = (language: PdfLanguage) => {
  if (language === 'ar') {
    return {
      brand: 'Sunlight Village',
      title: 'تقرير الأداء المالي',
      unit: 'اسم الوحدة',
      revenue: 'إجمالي الإيرادات',
      expenses: 'المصروفات',
      net: 'صافي الربح',
      total: 'الإجمالي',
    };
  }
  return {
    brand: 'Sunlight Village',
    title: 'Financial Report',
    unit: 'Unit Name',
    revenue: 'Total Revenue',
    expenses: 'Expenses',
    net: 'Net Profit',
    total: 'Total',
  };
};

export const buildFinancialReportElement = (opts: {
  data: UnitPerformanceData[];
  totals: { totalRevenue: number; totalExpenses: number; netProfit: number };
  language: PdfLanguage;
}): HTMLElement => {
  const { data, totals, language } = opts;
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

  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';
  table.style.border = '1px solid hsl(38 25% 88%)';

  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  const headers = [t.unit, t.revenue, t.expenses, t.net];
  headers.forEach((h) => {
    const th = document.createElement('th');
    th.textContent = h;
    th.style.padding = '10px';
    th.style.fontSize = '12px';
    th.style.fontWeight = '800';
    th.style.color = '#ffffff';
    th.style.background = 'hsl(200 85% 45%)';
    th.style.borderBottom = '1px solid hsl(38 25% 88%)';
    th.style.textAlign = isAr ? 'right' : 'left';
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  data.forEach((row, idx) => {
    const tr = document.createElement('tr');
    tr.style.background = idx % 2 === 0 ? 'hsl(45 30% 98%)' : '#ffffff';

    const cells: Array<[string, 'left' | 'right']> = [
      [row.unitName, isAr ? 'right' : 'left'],
      [formatMoney(row.totalRevenue, language), 'right'],
      [formatMoney(row.totalExpenses, language), 'right'],
      [formatMoney(row.netProfit, language), 'right'],
    ];

    cells.forEach(([val, align]) => {
      const td = document.createElement('td');
      td.textContent = val;
      td.style.padding = '10px';
      td.style.borderBottom = '1px solid hsl(38 25% 88%)';
      td.style.textAlign = align;
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });

  // Totals row
  const totalsRow = document.createElement('tr');
  totalsRow.style.background = 'hsl(38 20% 94%)';
  totalsRow.style.fontWeight = '800';

  const totalLabel = document.createElement('td');
  totalLabel.textContent = t.total;
  totalLabel.style.padding = '10px';
  totalLabel.style.borderBottom = 'none';
  totalLabel.style.textAlign = isAr ? 'right' : 'left';

  const totalRevenue = document.createElement('td');
  totalRevenue.textContent = formatMoney(totals.totalRevenue, language);
  totalRevenue.style.padding = '10px';
  totalRevenue.style.borderBottom = 'none';
  totalRevenue.style.textAlign = 'right';

  const totalExpenses = document.createElement('td');
  totalExpenses.textContent = formatMoney(totals.totalExpenses, language);
  totalExpenses.style.padding = '10px';
  totalExpenses.style.borderBottom = 'none';
  totalExpenses.style.textAlign = 'right';

  const totalNet = document.createElement('td');
  totalNet.textContent = formatMoney(totals.netProfit, language);
  totalNet.style.padding = '10px';
  totalNet.style.borderBottom = 'none';
  totalNet.style.textAlign = 'right';

  totalsRow.appendChild(totalLabel);
  totalsRow.appendChild(totalRevenue);
  totalsRow.appendChild(totalExpenses);
  totalsRow.appendChild(totalNet);
  tbody.appendChild(totalsRow);

  table.appendChild(tbody);
  root.appendChild(table);

  return root;
};
