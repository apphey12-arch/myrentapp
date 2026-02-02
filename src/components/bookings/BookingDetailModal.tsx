import { useState, useEffect, useMemo } from 'react';
import { Booking, BookingStatus, PaymentStatus, TenantRating, Unit, getUnitTypeEmoji } from '@/types/database';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Loader2, CalendarIcon, ThumbsUp, ThumbsDown, Trash2, Info, Download } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { formatEGP } from '@/lib/currency';
import { calculateEndDate, calculateTotalAmount } from '@/lib/date-utils';
import { UpdateBookingData } from '@/hooks/useBookings';
import { useLanguage } from '@/contexts/LanguageContext';
import { generateBookingReceipt, PdfLanguage } from '@/lib/pdf';
import { PdfLanguageModal } from '@/components/pdf/PdfLanguageModal';
import { toast } from '@/hooks/use-toast';

interface BookingDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking | null;
  units: Unit[];
  onUpdate: (data: UpdateBookingData) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const statusOptions: BookingStatus[] = ['Unconfirmed', 'Confirmed', 'Cancelled'];
const paymentStatusOptions: PaymentStatus[] = ['Pending', 'Paid', 'Overdue'];
const ratingOptions: { value: TenantRating; label: string; icon: typeof ThumbsUp }[] = [
  { value: 'Welcome Back', label: 'Welcome Back', icon: ThumbsUp },
  { value: 'Do Not Rent Again', label: 'Do Not Rent Again', icon: ThumbsDown },
];

export const BookingDetailModal = ({
  open,
  onOpenChange,
  booking,
  units,
  onUpdate,
  onDelete,
}: BookingDetailModalProps) => {
  const { t } = useLanguage();
  
  const [unitId, setUnitId] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [startDate, setStartDate] = useState<Date>();
  const [durationDays, setDurationDays] = useState(1);
  const [dailyRate, setDailyRate] = useState(0);
  const [status, setStatus] = useState<BookingStatus>('Unconfirmed');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Pending');
  
  // Dynamic pricing
  const [depositEnabled, setDepositEnabled] = useState(false);
  const [depositAmount, setDepositAmount] = useState(0);
  const [housekeepingEnabled, setHousekeepingEnabled] = useState(false);
  const [housekeepingAmount, setHousekeepingAmount] = useState(0);
  
  const [notes, setNotes] = useState('');
  const [tenantRating, setTenantRating] = useState<TenantRating | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);

  const handleDownloadReceipt = async (language: PdfLanguage) => {
    if (!booking) return;
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

  useEffect(() => {
    if (booking) {
      setUnitId(booking.unit_id);
      setTenantName(booking.tenant_name);
      setPhoneNumber(booking.phone_number || '');
      setStartDate(parseISO(booking.start_date));
      setDurationDays(booking.duration_days);
      setDailyRate(booking.daily_rate);
      setStatus(booking.status);
      setPaymentStatus(booking.payment_status || 'Pending');
      setDepositEnabled(booking.deposit_paid);
      setDepositAmount(booking.deposit_amount || 0);
      setHousekeepingEnabled(booking.housekeeping_required);
      setHousekeepingAmount(booking.housekeeping_amount || 0);
      setNotes(booking.notes || '');
      setTenantRating(booking.tenant_rating);
    }
  }, [booking]);

  const endDate = useMemo(() => {
    if (!startDate) return null;
    return calculateEndDate(startDate, durationDays);
  }, [startDate, durationDays]);

  // CORRECTED: Total = Base + Housekeeping (NO Deposit)
  const totalAmount = useMemo(() => {
    const baseAmount = calculateTotalAmount(dailyRate, durationDays);
    const housekeeping = housekeepingEnabled ? housekeepingAmount : 0;
    // Deposit is NOT added to total rent
    return baseAmount + housekeeping;
  }, [dailyRate, durationDays, housekeepingEnabled, housekeepingAmount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking || !unitId || !tenantName.trim() || !startDate || !endDate) return;

    setLoading(true);
    try {
      await onUpdate({
        id: booking.id,
        unit_id: unitId,
        tenant_name: tenantName.trim(),
        phone_number: phoneNumber.trim() || undefined,
        start_date: format(startDate, 'yyyy-MM-dd'),
        duration_days: durationDays,
        end_date: format(endDate, 'yyyy-MM-dd'),
        daily_rate: dailyRate,
        total_amount: totalAmount,
        status,
        payment_status: paymentStatus,
        deposit_paid: depositEnabled,
        deposit_amount: depositEnabled ? depositAmount : 0,
        housekeeping_required: housekeepingEnabled,
        housekeeping_amount: housekeepingEnabled ? housekeepingAmount : 0,
        notes: notes.trim() || undefined,
        tenant_rating: tenantRating,
      });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!booking) return;
    setDeleteLoading(true);
    try {
      await onDelete(booking.id);
      onOpenChange(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  const getStatusBadgeVariant = (s: BookingStatus) => {
    switch (s) {
      case 'Confirmed': return 'default';
      case 'Unconfirmed': return 'secondary';
      case 'Cancelled': return 'destructive';
    }
  };

  if (!booking) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="font-display">{t('edit')} Booking</DialogTitle>
          <Badge variant={getStatusBadgeVariant(status)}>{status}</Badge>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('unit')}</Label>
              <Select value={unitId} onValueChange={setUnitId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('unit')} />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {getUnitTypeEmoji(unit.type)} {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('status')}</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as BookingStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(s.toLowerCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('tenantName')}</Label>
              <Input
                placeholder={t('tenantName')}
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>{t('phoneNumber')}</Label>
              <Input
                placeholder={t('phoneNumber')}
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                type="tel"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('paymentStatus')}</Label>
            <Select value={paymentStatus} onValueChange={(v) => setPaymentStatus(v as PaymentStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paymentStatusOptions.map((s) => (
                  <SelectItem key={s} value={s}>
                    {t(s.toLowerCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('startDate')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !startDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                    {startDate ? format(startDate, 'PPP') : t('startDate')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>{t('duration')}</Label>
              <Input
                type="number"
                min={1}
                value={durationDays}
                onChange={(e) => setDurationDays(Math.max(1, parseInt(e.target.value) || 1))}
                required
              />
            </div>
          </div>

          {endDate && (
            <div className="rounded-lg bg-secondary/50 p-3 text-sm">
              <span className="text-muted-foreground">{t('endDate')}: </span>
              <span className="font-medium">{format(endDate, 'PPP')}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('dailyRate')} (EGP)</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={dailyRate}
                onChange={(e) => setDailyRate(parseFloat(e.target.value) || 0)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>{t('totalAmount')}</Label>
              <div className="flex h-10 items-center rounded-md border bg-muted/50 px-3 font-semibold text-primary">
                {formatEGP(totalAmount)}
              </div>
            </div>
          </div>

          {/* Housekeeping Toggle with Amount */}
          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="housekeeping-edit" className="cursor-pointer">{t('housekeeping')}</Label>
              <Switch
                checked={housekeepingEnabled}
                onCheckedChange={setHousekeepingEnabled}
                id="housekeeping-edit"
              />
            </div>
            {housekeepingEnabled && (
              <Input
                type="number"
                min={0}
                step="0.01"
                placeholder={`${t('housekeeping')} (EGP)`}
                value={housekeepingAmount}
                onChange={(e) => setHousekeepingAmount(parseFloat(e.target.value) || 0)}
              />
            )}
          </div>

          {/* Deposit Toggle with Amount - REFUNDABLE */}
          <div className="space-y-3 rounded-lg border p-4 border-dashed">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label htmlFor="deposit-edit" className="cursor-pointer">{t('deposit')}</Label>
                <span className="text-xs text-muted-foreground">(Refundable)</span>
              </div>
              <Switch
                checked={depositEnabled}
                onCheckedChange={setDepositEnabled}
                id="deposit-edit"
              />
            </div>
            {depositEnabled && (
              <>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder={`${t('deposit')} (EGP)`}
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(parseFloat(e.target.value) || 0)}
                />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Info className="h-3 w-3" />
                  <span>Deposit is not included in Total Rent</span>
                </div>
              </>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t('tenantRating')}</Label>
            <div className="flex gap-2">
              {ratingOptions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={tenantRating === option.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTenantRating(
                    tenantRating === option.value ? null : option.value
                  )}
                  className={cn(
                    option.value === 'Welcome Back' && tenantRating === option.value && 'bg-success hover:bg-success/90',
                    option.value === 'Do Not Rent Again' && tenantRating === option.value && 'bg-destructive hover:bg-destructive/90'
                  )}
                >
                  <option.icon className="h-4 w-4 ltr:mr-1 rtl:ml-1" />
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('notes')}</Label>
            <Textarea
              placeholder={t('notes')}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex flex-wrap gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPdfModalOpen(true)}
              className="flex-1"
            >
              <Download className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
              Receipt
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteLoading}
              className="flex-1"
            >
              {deleteLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Trash2 className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                  {t('delete')}
                </>
              )}
            </Button>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={loading || !unitId || !startDate}
              className="gradient-ocean"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t('save')
              )}
            </Button>
          </div>
        </form>

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
