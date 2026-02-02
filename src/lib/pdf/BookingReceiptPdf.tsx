import React from 'react';
import { Document, Page, View, Text } from '@react-pdf/renderer';
import { Booking } from '@/types/database';
import { pdfStyles } from './styles';
import { getPdfTranslations, formatPdfCurrency, formatPdfDate } from './translations';

type Language = 'en' | 'ar';

interface BookingReceiptPdfProps {
  booking: Booking;
  language: Language;
}

/**
 * Booking Receipt PDF Document Component
 * Professional receipt with Sunlight Village branding
 */
export const BookingReceiptPdf: React.FC<BookingReceiptPdfProps> = ({ booking, language }) => {
  const t = getPdfTranslations(language);
  const isRtl = language === 'ar';

  // Financial calculations
  const baseAmount = booking.daily_rate * booking.duration_days;
  const housekeepingAmount = booking.housekeeping_amount || 0;
  const grandTotal = baseAmount + housekeepingAmount;
  const depositAmount = booking.deposit_amount || 0;

  const rowStyle = isRtl ? pdfStyles.rowRtl : pdfStyles.row;
  const valueStyle = isRtl ? pdfStyles.rowValueRtl : pdfStyles.rowValue;
  const totalRowStyle = isRtl ? pdfStyles.totalRowRtl : pdfStyles.totalRow;
  const depositRowStyle = isRtl ? pdfStyles.depositRowRtl : pdfStyles.depositRow;

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        {/* Header */}
        <View style={pdfStyles.header}>
          <Text style={pdfStyles.headerTitle}>{t.brandName}</Text>
          <Text style={pdfStyles.headerSubtitle}>{t.bookingReceipt}</Text>
        </View>

        {/* Tenant Information */}
        <View style={pdfStyles.section}>
          <Text style={[pdfStyles.sectionTitle, isRtl && pdfStyles.textRight]}>
            {t.tenantInformation}
          </Text>
          <View style={[rowStyle, pdfStyles.rowAlternate]}>
            <Text style={pdfStyles.rowLabel}>{t.tenantName}</Text>
            <Text style={valueStyle}>{booking.tenant_name}</Text>
          </View>
          {booking.phone_number && (
            <View style={rowStyle}>
              <Text style={pdfStyles.rowLabel}>{t.phoneNumber}</Text>
              <Text style={valueStyle}>{booking.phone_number}</Text>
            </View>
          )}
        </View>

        {/* Property Details */}
        <View style={pdfStyles.section}>
          <Text style={[pdfStyles.sectionTitle, isRtl && pdfStyles.textRight]}>
            {t.propertyDetails}
          </Text>
          <View style={[rowStyle, pdfStyles.rowAlternate]}>
            <Text style={pdfStyles.rowLabel}>{t.unit}</Text>
            <Text style={valueStyle}>
              {booking.unit?.name || 'N/A'}
            </Text>
          </View>
          <View style={rowStyle}>
            <Text style={pdfStyles.rowLabel}>{t.unitType}</Text>
            <Text style={valueStyle}>
              {booking.unit?.type || 'N/A'}
            </Text>
          </View>
        </View>

        {/* Booking Dates */}
        <View style={pdfStyles.section}>
          <Text style={[pdfStyles.sectionTitle, isRtl && pdfStyles.textRight]}>
            {t.bookingDates}
          </Text>
          <View style={[rowStyle, pdfStyles.rowAlternate]}>
            <Text style={pdfStyles.rowLabel}>{t.checkIn}</Text>
            <Text style={valueStyle}>{formatPdfDate(booking.start_date, language)}</Text>
          </View>
          <View style={rowStyle}>
            <Text style={pdfStyles.rowLabel}>{t.checkOut}</Text>
            <Text style={valueStyle}>{formatPdfDate(booking.end_date, language)}</Text>
          </View>
          <View style={[rowStyle, pdfStyles.rowAlternate]}>
            <Text style={pdfStyles.rowLabel}>{t.duration}</Text>
            <Text style={valueStyle}>{booking.duration_days} {t.days}</Text>
          </View>
        </View>

        {/* Financial Breakdown */}
        <View style={pdfStyles.section}>
          <Text style={[pdfStyles.sectionTitle, isRtl && pdfStyles.textRight]}>
            {t.financialBreakdown}
          </Text>
          <View style={[rowStyle, pdfStyles.rowAlternate]}>
            <Text style={pdfStyles.rowLabel}>{t.dailyRate}</Text>
            <Text style={valueStyle}>{formatPdfCurrency(booking.daily_rate)}</Text>
          </View>
          <View style={rowStyle}>
            <Text style={pdfStyles.rowLabel}>{t.totalRent} ({booking.duration_days} {t.days})</Text>
            <Text style={valueStyle}>{formatPdfCurrency(baseAmount)}</Text>
          </View>
          {housekeepingAmount > 0 && (
            <View style={[rowStyle, pdfStyles.rowAlternate]}>
              <Text style={pdfStyles.rowLabel}>{t.housekeeping}</Text>
              <Text style={valueStyle}>{formatPdfCurrency(housekeepingAmount)}</Text>
            </View>
          )}
        </View>

        {/* Grand Total */}
        <View style={pdfStyles.totalSection}>
          <View style={totalRowStyle}>
            <Text style={pdfStyles.totalLabel}>{t.grandTotal}</Text>
            <Text style={pdfStyles.totalValue}>{formatPdfCurrency(grandTotal)}</Text>
          </View>
        </View>

        {/* Security Deposit (Refundable - Not included in total) */}
        {depositAmount > 0 && (
          <View style={pdfStyles.depositSection}>
            <View style={depositRowStyle}>
              <Text style={pdfStyles.depositLabel}>
                {t.securityDeposit} {t.refundable}
              </Text>
              <Text style={pdfStyles.depositValue}>{formatPdfCurrency(depositAmount)}</Text>
            </View>
          </View>
        )}

        {/* Status */}
        <View style={[pdfStyles.section, { marginTop: 20 }]}>
          <View style={rowStyle}>
            <Text style={pdfStyles.rowLabel}>{t.status}</Text>
            <Text style={valueStyle}>{booking.status}</Text>
          </View>
          <View style={[rowStyle, pdfStyles.rowAlternate]}>
            <Text style={pdfStyles.rowLabel}>{t.paymentStatus}</Text>
            <Text style={valueStyle}>{booking.payment_status}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={pdfStyles.footer} fixed>
          <Text>{t.thankYou}</Text>
          <Text style={{ marginTop: 5 }}>
            {t.generatedOn}: {new Date().toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
          </Text>
        </View>
      </Page>
    </Document>
  );
};
