import { useState } from 'react';
import { Booking, getUnitTypeEmoji } from '@/types/database';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatEGP } from '@/lib/currency';
import { formatDateRange } from '@/lib/date-utils';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { Phone, MessageCircle, Calendar, Home, Download, Loader2 } from 'lucide-react';
import { generateBookingReceipt, PdfLanguage } from '@/lib/pdf';
import { PdfLanguageModal } from '@/components/pdf/PdfLanguageModal';
import { toast } from '@/hooks/use-toast';

interface TenantDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking | null;
}

const getPaymentStatusStyles = (status: string) => {
  switch (status) {
    case 'Paid':
      return 'bg-success/10 text-success border-success/20';
    case 'Pending':
      return 'bg-warning/10 text-warning-foreground border-warning/20';
    case 'Overdue':
      return 'bg-destructive/10 text-destructive border-destructive/20';
    default:
      return '';
  }
};

const openWhatsApp = (phone: string, tenantName: string) => {
  const message = encodeURIComponent(`Hello ${tenantName}, this is Sunlight Village.`);
  const cleanPhone = phone.replace(/\D/g, '');
  window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
};

export const TenantDetailModal = ({ open, onOpenChange, booking }: TenantDetailModalProps) => {
  const { t } = useLanguage();
  const [pdfModalOpen, setPdfModalOpen] = useState(false);

  if (!booking) return null;

  // Calculate correct total (without deposit)
  const baseAmount = booking.daily_rate * booking.duration_days;
  const housekeepingAmount = booking.housekeeping_amount || 0;
  const totalRent = baseAmount + housekeepingAmount;

  const handleDownloadReceipt = async (language: PdfLanguage) => {
    try {
      await generateBookingReceipt(booking, language);
      toast({
        title: 'Receipt Downloaded',
        description: 'Your booking receipt has been generated successfully.',
      });
    } catch (error) {
      console.error('Failed to generate receipt:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to generate the PDF. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <span className="text-2xl">{booking.tenant_name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Contact Info */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              {t('tenantInformation')}
            </h3>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">{t('phoneNumber')}</p>
                <p className="font-medium">{booking.phone_number || '—'}</p>
              </div>
              {booking.phone_number && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-green-500 hover:text-green-600 hover:bg-green-50"
                  onClick={() => openWhatsApp(booking.phone_number!, booking.tenant_name)}
                >
                  <MessageCircle className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>

          {/* Property Details */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              {t('propertyDetails')}
            </h3>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20">
                <Home className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('unit')}</p>
                <p className="font-medium">
                  {booking.unit?.type && getUnitTypeEmoji(booking.unit.type)} {booking.unit?.name || 'Unknown'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                <Calendar className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Dates</p>
                <p className="font-medium">{formatDateRange(booking.start_date, booking.end_date)}</p>
                <p className="text-sm text-muted-foreground">{booking.duration_days} days</p>
              </div>
            </div>
          </div>

          {/* Financial Details - CORRECTED CALCULATION */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Financials
            </h3>
            
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">{t('dailyRate')}</span>
                <span className="font-medium">{formatEGP(booking.daily_rate)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Base Amount</span>
                <span className="font-medium">{formatEGP(baseAmount)}</span>
              </div>
              {housekeepingAmount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t('housekeeping')}</span>
                  <span className="font-medium">{formatEGP(housekeepingAmount)}</span>
                </div>
              )}
              
              {/* Total Rent (without deposit) */}
              <div className="border-t pt-3 flex justify-between items-center">
                <span className="font-semibold">{t('totalAmount')}</span>
                <span className="font-bold text-lg text-primary">{formatEGP(totalRent)}</span>
              </div>

              {/* Refundable Deposit - Separate */}
              {booking.deposit_amount > 0 && (
                <div className="flex justify-between items-center pt-2 border-t border-dashed">
                  <span className="text-muted-foreground text-sm">
                    {t('deposit')} <span className="text-xs">(Refundable)</span>
                  </span>
                  <span className="font-medium text-muted-foreground">{formatEGP(booking.deposit_amount)}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Badge
                variant="outline"
                className={cn('font-medium', 
                  booking.status === 'Confirmed' ? 'bg-success/10 text-success' : 
                  booking.status === 'Cancelled' ? 'bg-muted text-muted-foreground' : 
                  'bg-warning/10 text-warning-foreground'
                )}
              >
                {booking.status}
              </Badge>
              <Badge
                variant="outline"
                className={cn('font-medium', getPaymentStatusStyles(booking.payment_status))}
              >
                {booking.payment_status}
              </Badge>
            </div>
          </div>

          {/* Notes */}
          {/* Download Receipt Button */}
          <div className="pt-4 border-t">
            <Button
              onClick={() => setPdfModalOpen(true)}
              className="w-full gradient-ocean gap-2"
            >
              <Download className="h-4 w-4" />
              Download Receipt
            </Button>
          </div>
        </div>

        {/* PDF Language Selection Modal */}
        <PdfLanguageModal
          open={pdfModalOpen}
          onOpenChange={setPdfModalOpen}
          onConfirm={handleDownloadReceipt}
          title="Download Receipt"
        />
      </DialogContent>
    </Dialog>
  );
};
