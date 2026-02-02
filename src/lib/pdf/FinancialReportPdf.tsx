import React from 'react';
import { Document, Page, View, Text } from '@react-pdf/renderer';
import { pdfStyles } from './styles';
import { getPdfTranslations, formatPdfCurrency } from './translations';

type Language = 'en' | 'ar';

interface UnitPerformanceData {
  unitName: string;
  unitType: string;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
}

interface FinancialReportPdfProps {
  data: UnitPerformanceData[];
  totals: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
  };
  language: Language;
}

/**
 * Financial Report PDF Document Component
 * Professional A4 table with unit performance data
 */
export const FinancialReportPdf: React.FC<FinancialReportPdfProps> = ({ 
  data, 
  totals, 
  language 
}) => {
  const t = getPdfTranslations(language);
  const isRtl = language === 'ar';

  const headerStyle = isRtl ? pdfStyles.tableHeaderRtl : pdfStyles.tableHeader;
  const rowBaseStyle = isRtl ? pdfStyles.tableRowRtl : pdfStyles.tableRow;

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        {/* Header */}
        <View style={pdfStyles.header}>
          <Text style={pdfStyles.headerTitle}>{t.brandName}</Text>
          <Text style={pdfStyles.headerSubtitle}>{t.unitPerformanceReport}</Text>
        </View>

        {/* Table */}
        <View style={pdfStyles.table}>
          {/* Table Header */}
          <View style={headerStyle}>
            <Text style={pdfStyles.tableHeaderCell}>{t.unitName}</Text>
            <Text style={pdfStyles.tableHeaderCell}>{t.unitType}</Text>
            <Text style={pdfStyles.tableHeaderCell}>{t.totalRevenue}</Text>
            <Text style={pdfStyles.tableHeaderCell}>{t.expenses}</Text>
            <Text style={pdfStyles.tableHeaderCell}>{t.netProfit}</Text>
          </View>

          {/* Table Rows */}
          {data.map((unit, index) => (
            <View 
              key={unit.unitName} 
              style={[
                rowBaseStyle, 
                index % 2 === 1 && pdfStyles.tableRowAlternate
              ]}
            >
              <Text style={pdfStyles.tableCell}>{unit.unitName}</Text>
              <Text style={pdfStyles.tableCell}>{unit.unitType}</Text>
              <Text style={[pdfStyles.tableCell, pdfStyles.success]}>
                {formatPdfCurrency(unit.totalRevenue)}
              </Text>
              <Text style={[pdfStyles.tableCell, pdfStyles.error]}>
                {formatPdfCurrency(unit.totalExpenses)}
              </Text>
              <Text style={[
                pdfStyles.tableCell, 
                pdfStyles.bold,
                unit.netProfit >= 0 ? pdfStyles.success : pdfStyles.error
              ]}>
                {unit.netProfit >= 0 ? '+' : ''}{formatPdfCurrency(unit.netProfit)}
              </Text>
            </View>
          ))}

          {/* Totals Row */}
          <View style={[rowBaseStyle, { backgroundColor: '#e0f2fe', borderTopWidth: 2, borderTopColor: '#0ea5e9' }]}>
            <Text style={[pdfStyles.tableCell, pdfStyles.bold]}>{t.total}</Text>
            <Text style={pdfStyles.tableCell}>—</Text>
            <Text style={[pdfStyles.tableCell, pdfStyles.bold, pdfStyles.success]}>
              {formatPdfCurrency(totals.totalRevenue)}
            </Text>
            <Text style={[pdfStyles.tableCell, pdfStyles.bold, pdfStyles.error]}>
              {formatPdfCurrency(totals.totalExpenses)}
            </Text>
            <Text style={[
              pdfStyles.tableCell, 
              pdfStyles.bold,
              totals.netProfit >= 0 ? pdfStyles.success : pdfStyles.error
            ]}>
              {totals.netProfit >= 0 ? '+' : ''}{formatPdfCurrency(totals.netProfit)}
            </Text>
          </View>
        </View>

        {/* Summary Cards */}
        <View style={{ flexDirection: isRtl ? 'row-reverse' : 'row', marginTop: 30, gap: 15 }}>
          <View style={{ flex: 1, padding: 15, backgroundColor: '#dcfce7', borderRadius: 4 }}>
            <Text style={[pdfStyles.muted, { fontSize: 10 }]}>{t.totalRevenue}</Text>
            <Text style={[pdfStyles.success, pdfStyles.bold, { fontSize: 16, marginTop: 5 }]}>
              {formatPdfCurrency(totals.totalRevenue)}
            </Text>
          </View>
          <View style={{ flex: 1, padding: 15, backgroundColor: '#fee2e2', borderRadius: 4 }}>
            <Text style={[pdfStyles.muted, { fontSize: 10 }]}>{t.expenses}</Text>
            <Text style={[pdfStyles.error, pdfStyles.bold, { fontSize: 16, marginTop: 5 }]}>
              {formatPdfCurrency(totals.totalExpenses)}
            </Text>
          </View>
          <View style={{ 
            flex: 1, 
            padding: 15, 
            backgroundColor: totals.netProfit >= 0 ? '#dcfce7' : '#fee2e2', 
            borderRadius: 4 
          }}>
            <Text style={[pdfStyles.muted, { fontSize: 10 }]}>{t.netProfit}</Text>
            <Text style={[
              pdfStyles.bold, 
              { fontSize: 16, marginTop: 5, color: totals.netProfit >= 0 ? '#16a34a' : '#dc2626' }
            ]}>
              {totals.netProfit >= 0 ? '+' : ''}{formatPdfCurrency(totals.netProfit)}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={pdfStyles.footer} fixed>
          <Text>{t.brandName} - {t.allRightsReserved}</Text>
          <Text style={{ marginTop: 5 }}>
            {t.generatedOn}: {new Date().toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
          </Text>
        </View>
      </Page>
    </Document>
  );
};
