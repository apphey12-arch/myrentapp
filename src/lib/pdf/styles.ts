import { StyleSheet } from '@react-pdf/renderer';

/**
 * Shared PDF styles for consistent branding
 */
export const pdfStyles = StyleSheet.create({
  // Page styles
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontFamily: 'Cairo',
    fontSize: 11,
  },
  pageRtl: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontFamily: 'Cairo',
    fontSize: 11,
  },

  // Header
  header: {
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: '#0ea5e9',
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0c4a6e',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },

  // Section styles
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0c4a6e',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 6,
  },

  // Row styles
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  rowRtl: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  rowAlternate: {
    backgroundColor: '#f8fafc',
  },
  rowLabel: {
    color: '#64748b',
    flex: 1,
  },
  rowValue: {
    fontWeight: 'bold',
    color: '#1e293b',
    flex: 1,
    textAlign: 'right',
  },
  rowValueRtl: {
    fontWeight: 'bold',
    color: '#1e293b',
    flex: 1,
    textAlign: 'left',
  },

  // Table styles
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0ea5e9',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  tableHeaderRtl: {
    flexDirection: 'row-reverse',
    backgroundColor: '#0ea5e9',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 10,
    flex: 1,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tableRowRtl: {
    flexDirection: 'row-reverse',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tableRowAlternate: {
    backgroundColor: '#f8fafc',
  },
  tableCell: {
    flex: 1,
    fontSize: 10,
    textAlign: 'center',
  },

  // Total section
  totalSection: {
    marginTop: 20,
    borderTopWidth: 2,
    borderTopColor: '#0ea5e9',
    paddingTop: 15,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  totalRowRtl: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0c4a6e',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0ea5e9',
  },

  // Deposit section (refundable)
  depositSection: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#fef3c7',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#fcd34d',
    borderStyle: 'dashed',
  },
  depositRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  depositRowRtl: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
  },
  depositLabel: {
    color: '#92400e',
    fontSize: 10,
  },
  depositValue: {
    color: '#92400e',
    fontWeight: 'bold',
    fontSize: 10,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 9,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 15,
  },

  // Status badges
  badgeSuccess: {
    backgroundColor: '#dcfce7',
    color: '#166534',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 9,
  },
  badgeWarning: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 9,
  },
  badgeError: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 9,
  },

  // Utility
  textCenter: {
    textAlign: 'center',
  },
  textRight: {
    textAlign: 'right',
  },
  textLeft: {
    textAlign: 'left',
  },
  bold: {
    fontWeight: 'bold',
  },
  muted: {
    color: '#64748b',
  },
  success: {
    color: '#16a34a',
  },
  error: {
    color: '#dc2626',
  },
});

/**
 * Color constants for PDF
 */
export const pdfColors = {
  primary: '#0ea5e9',
  primaryDark: '#0c4a6e',
  success: '#16a34a',
  error: '#dc2626',
  warning: '#f59e0b',
  muted: '#64748b',
  border: '#e2e8f0',
  background: '#f8fafc',
  white: '#ffffff',
};
