import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatEGP } from './currency';
import { BookingStatus, UnitType } from '@/types/database';

interface BookingReceiptData {
  tenantName: string;
  unitName: string;
  unitType: UnitType;
  startDate: string;
  endDate: string;
  durationDays: number;
  dailyRate: number;
  totalAmount: number;
  status: BookingStatus;
  depositPaid: boolean;
}

export const generateBookingPDF = (data: BookingReceiptData) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFillColor(14, 116, 144); // Ocean blue
  doc.rect(0, 0, 210, 45, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Sunlight Village', 20, 25);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Booking Receipt', 20, 35);
  
  // Reset colors
  doc.setTextColor(0, 0, 0);
  
  // Receipt details
  doc.setFontSize(10);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 55);
  
  // Tenant info section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Tenant Information', 20, 65);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${data.tenantName}`, 20, 75);
  doc.text(`Status: ${data.status}`, 20, 82);
  doc.text(`Deposit Paid: ${data.depositPaid ? 'Yes' : 'No'}`, 20, 89);
  
  // Unit info section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Property Details', 20, 105);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Unit: ${data.unitName}`, 20, 115);
  doc.text(`Type: ${data.unitType}`, 20, 122);
  
  // Booking dates table
  autoTable(doc, {
    startY: 135,
    head: [['Description', 'Details']],
    body: [
      ['Check-in Date', data.startDate],
      ['Check-out Date', data.endDate],
      ['Duration', `${data.durationDays} day${data.durationDays > 1 ? 's' : ''}`],
    ],
    theme: 'striped',
    headStyles: { fillColor: [14, 116, 144] },
    margin: { left: 20, right: 20 },
  });
  
  // Pricing table
  const finalY = (doc as any).lastAutoTable.finalY || 165;
  
  autoTable(doc, {
    startY: finalY + 15,
    head: [['Pricing', 'Amount (EGP)']],
    body: [
      ['Daily Rate', formatEGP(data.dailyRate)],
      ['Duration', `${data.durationDays} days`],
      ['Total Amount', formatEGP(data.totalAmount)],
    ],
    theme: 'striped',
    headStyles: { fillColor: [14, 116, 144] },
    margin: { left: 20, right: 20 },
    foot: [['Grand Total', formatEGP(data.totalAmount)]],
    footStyles: { fillColor: [251, 191, 36], textColor: [0, 0, 0], fontStyle: 'bold' },
  });
  
  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(9);
  doc.setTextColor(128, 128, 128);
  doc.text('Thank you for choosing Sunlight Village!', 105, pageHeight - 20, { align: 'center' });
  doc.text('For inquiries, please contact our management office.', 105, pageHeight - 14, { align: 'center' });
  
  // Save PDF
  doc.save(`booking-receipt-${data.tenantName.replace(/\s+/g, '-')}.pdf`);
};

interface ReportData {
  dateRange: string;
  unitScope: string;
  totalRevenue: number;
  totalBookings: number;
  occupiedDays: number;
  averageDailyRate: number;
  bookings: {
    unitName: string;
    tenantName: string;
    dates: string;
    amount: number;
    status: string;
  }[];
}

export const generateReportPDF = (data: ReportData) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFillColor(14, 116, 144);
  doc.rect(0, 0, 210, 50, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Sunlight Village', 20, 25);
  
  doc.setFontSize(14);
  doc.text('Financial Report', 20, 35);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 44);
  
  // Reset colors
  doc.setTextColor(0, 0, 0);
  
  // Report filters
  doc.setFontSize(11);
  doc.text(`Date Range: ${data.dateRange}`, 20, 60);
  doc.text(`Scope: ${data.unitScope}`, 20, 67);
  
  // Summary cards
  doc.setFillColor(240, 240, 240);
  doc.roundedRect(20, 75, 80, 35, 3, 3, 'F');
  doc.roundedRect(110, 75, 80, 35, 3, 3, 'F');
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Total Revenue', 30, 85);
  doc.text('Total Bookings', 120, 85);
  
  doc.setFontSize(16);
  doc.setTextColor(14, 116, 144);
  doc.setFont('helvetica', 'bold');
  doc.text(formatEGP(data.totalRevenue), 30, 100);
  doc.text(data.totalBookings.toString(), 120, 100);
  
  doc.setFillColor(240, 240, 240);
  doc.roundedRect(20, 115, 80, 35, 3, 3, 'F');
  doc.roundedRect(110, 115, 80, 35, 3, 3, 'F');
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.text('Occupied Days', 30, 125);
  doc.text('Avg. Daily Rate', 120, 125);
  
  doc.setFontSize(16);
  doc.setTextColor(14, 116, 144);
  doc.setFont('helvetica', 'bold');
  doc.text(`${data.occupiedDays} days`, 30, 140);
  doc.text(formatEGP(data.averageDailyRate), 120, 140);
  
  // Bookings table
  doc.setTextColor(0, 0, 0);
  
  autoTable(doc, {
    startY: 160,
    head: [['Unit', 'Tenant', 'Dates', 'Amount', 'Status']],
    body: data.bookings.map(b => [
      b.unitName,
      b.tenantName,
      b.dates,
      formatEGP(b.amount),
      b.status,
    ]),
    theme: 'striped',
    headStyles: { fillColor: [14, 116, 144] },
    margin: { left: 20, right: 20 },
    styles: { fontSize: 9 },
  });
  
  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(9);
  doc.setTextColor(128, 128, 128);
  doc.setFont('helvetica', 'normal');
  doc.text('Sunlight Village Property Management System', 105, pageHeight - 10, { align: 'center' });
  
  // Save PDF
  doc.save(`report-${data.dateRange.replace(/\s+/g, '-')}.pdf`);
};
