import type { PdfLanguage } from '../translations';
import type { Expense } from '@/types/database';

export interface ExpensesReportOptions {
  expenses: Expense[];
  language: PdfLanguage;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

const formatMoney = (amount: number, language: PdfLanguage): string => {
  const locale = language === 'ar' ? 'ar-EG' : 'en-EG';
  return (
    new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount) + ' EGP'
  );
};

const formatDate = (dateStr: string, language: PdfLanguage): string => {
  const date = new Date(dateStr);
  const locale = language === 'ar' ? 'ar-EG' : 'en-US';
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const text = (language: PdfLanguage) => {
  if (language === 'ar') {
    return {
      brand: 'Sunlight Village',
      title: 'تقرير المصروفات',
      date: 'التاريخ',
      unit: 'الوحدة',
      name: 'اسم المصروف',
      category: 'الفئة',
      amount: 'المبلغ',
      total: 'إجمالي المصروفات',
      general: 'عام',
      dateRange: 'الفترة',
    };
  }
  return {
    brand: 'Sunlight Village',
    title: 'Expenses Report',
    date: 'Date',
    unit: 'Unit',
    name: 'Expense Name',
    category: 'Category',
    amount: 'Amount',
    total: 'Total Expenses',
    general: 'General',
    dateRange: 'Period',
  };
};

export const buildExpensesReportElement = (opts: ExpensesReportOptions): HTMLElement => {
  const { expenses, language, dateRange } = opts;
  const t = text(language);
  const isAr = language === 'ar';

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

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

  // Date range subtitle
  if (dateRange) {
    const dateRangeText = document.createElement('div');
    const fromStr = formatDate(dateRange.from.toISOString(), language);
    const toStr = formatDate(dateRange.to.toISOString(), language);
    dateRangeText.textContent = `${t.dateRange}: ${fromStr} - ${toStr}`;
    dateRangeText.style.fontSize = '12px';
    dateRangeText.style.color = 'hsl(215 15% 55%)';
    dateRangeText.style.marginTop = '4px';
    header.appendChild(brand);
    header.appendChild(title);
    header.appendChild(dateRangeText);
  } else {
    header.appendChild(brand);
    header.appendChild(title);
  }

  const divider = document.createElement('div');
  divider.style.height = '2px';
  divider.style.width = '100%';
  divider.style.background = 'hsl(200 85% 45%)';
  divider.style.borderRadius = '2px';
  divider.style.opacity = '0.8';
  divider.style.marginTop = '10px';
  header.appendChild(divider);

  root.appendChild(header);

  // Table
  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';
  table.style.border = '1px solid hsl(38 25% 88%)';
  table.style.marginTop = '10px';

  // Table header
  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  const headers = [t.date, t.unit, t.name, t.category, t.amount];
  
  headers.forEach((h) => {
    const th = document.createElement('th');
    th.textContent = h;
    th.style.padding = '10px';
    th.style.fontSize = '11px';
    th.style.fontWeight = '800';
    th.style.color = '#ffffff';
    th.style.background = 'hsl(200 85% 45%)';
    th.style.borderBottom = '1px solid hsl(38 25% 88%)';
    th.style.textAlign = h === t.amount ? 'right' : (isAr ? 'right' : 'left');
    headRow.appendChild(th);
  });
  
  thead.appendChild(headRow);
  table.appendChild(thead);

  // Table body
  const tbody = document.createElement('tbody');
  
  expenses.forEach((expense, idx) => {
    const tr = document.createElement('tr');
    tr.style.background = idx % 2 === 0 ? 'hsl(45 30% 98%)' : '#ffffff';

    // Date cell
    const dateCell = document.createElement('td');
    dateCell.textContent = formatDate(expense.expense_date, language);
    dateCell.style.padding = '10px';
    dateCell.style.borderBottom = '1px solid hsl(38 25% 88%)';
    dateCell.style.fontSize = '11px';
    tr.appendChild(dateCell);

    // Unit cell
    const unitCell = document.createElement('td');
    unitCell.textContent = expense.unit ? expense.unit.name : t.general;
    unitCell.style.padding = '10px';
    unitCell.style.borderBottom = '1px solid hsl(38 25% 88%)';
    unitCell.style.fontSize = '11px';
    if (!expense.unit) {
      unitCell.style.color = 'hsl(215 15% 55%)';
      unitCell.style.fontStyle = 'italic';
    }
    tr.appendChild(unitCell);

    // Name cell
    const nameCell = document.createElement('td');
    nameCell.textContent = expense.description;
    nameCell.style.padding = '10px';
    nameCell.style.borderBottom = '1px solid hsl(38 25% 88%)';
    nameCell.style.fontSize = '11px';
    nameCell.style.fontWeight = '600';
    tr.appendChild(nameCell);

    // Category cell
    const categoryCell = document.createElement('td');
    categoryCell.textContent = expense.category;
    categoryCell.style.padding = '10px';
    categoryCell.style.borderBottom = '1px solid hsl(38 25% 88%)';
    categoryCell.style.fontSize = '11px';
    tr.appendChild(categoryCell);

    // Amount cell
    const amountCell = document.createElement('td');
    amountCell.textContent = formatMoney(expense.amount, language);
    amountCell.style.padding = '10px';
    amountCell.style.borderBottom = '1px solid hsl(38 25% 88%)';
    amountCell.style.textAlign = 'right';
    amountCell.style.fontSize = '11px';
    amountCell.style.fontWeight = '600';
    amountCell.style.color = 'hsl(0 70% 45%)';
    tr.appendChild(amountCell);

    tbody.appendChild(tr);
  });

  // Total row
  const totalsRow = document.createElement('tr');
  totalsRow.style.background = 'hsl(38 20% 94%)';
  totalsRow.style.fontWeight = '800';

  const totalLabelCell = document.createElement('td');
  totalLabelCell.textContent = t.total;
  totalLabelCell.colSpan = 4;
  totalLabelCell.style.padding = '12px 10px';
  totalLabelCell.style.borderTop = '2px solid hsl(200 85% 45%)';
  totalLabelCell.style.fontSize = '12px';
  totalsRow.appendChild(totalLabelCell);

  const totalAmountCell = document.createElement('td');
  totalAmountCell.textContent = formatMoney(totalExpenses, language);
  totalAmountCell.style.padding = '12px 10px';
  totalAmountCell.style.textAlign = 'right';
  totalAmountCell.style.borderTop = '2px solid hsl(200 85% 45%)';
  totalAmountCell.style.fontSize = '12px';
  totalAmountCell.style.color = 'hsl(0 70% 45%)';
  totalsRow.appendChild(totalAmountCell);

  tbody.appendChild(totalsRow);
  table.appendChild(tbody);
  root.appendChild(table);

  // Footer with record count
  const footer = document.createElement('div');
  footer.style.marginTop = '16px';
  footer.style.fontSize = '10px';
  footer.style.color = 'hsl(215 15% 55%)';
  footer.style.textAlign = 'center';
  footer.textContent = language === 'ar' 
    ? `عدد السجلات: ${expenses.length}`
    : `Total Records: ${expenses.length}`;
  root.appendChild(footer);

  return root;
};
