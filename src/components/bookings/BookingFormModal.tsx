import { useState, useEffect, useMemo } from 'react';
import { Booking, BookingStatus, PaymentStatus, Unit } from '@/types/database';
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
import { Loader2, CalendarIcon, Info } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { formatEGP } from '@/lib/currency';
import { calculateEndDate, calculateTotalAmount } from '@/lib/date-utils';
import { CreateBookingData } from '@/hooks/useBookings';
import { useLanguage } from '@/contexts/LanguageContext';

interface BookingFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  units: Unit[];
  onSubmit: (data: CreateBookingData) => Promise<void>;
}

const statusOptions: BookingStatus[] = ['Unconfirmed', 'Confirmed', 'Cancelled'];
const paymentStatusOptions: PaymentStatus[] = ['Pending', 'Paid', 'Overdue'];

export const BookingFormModal = ({
  open,
  onOpenChange,
  units,
  onSubmit,
}: BookingFormModalProps) => {
  const { t } = useLanguage();
  
  const [unitId, setUnitId] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [startDate, setStartDate] = useState<Date>();
  const [durationDays, setDurationDays] = useState(1);
  const [dailyRate, setDailyRate] = useState(0);
  const [status, setStatus] = useState<BookingStatus>('Unconfirmed');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Pending');
  
  // Dynamic pricing toggles
  const [depositEnabled, setDepositEnabled] = useState(false);
  const [depositAmount, setDepositAmount] = useState(0);
  const [housekeepingEnabled, setHousekeepingEnabled] = useState(false);
  const [housekeepingAmount, setHousekeepingAmount] = useState(0);
  
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setUnitId(units[0]?.id || '');
      setTenantName('');
      setPhoneNumber('');
      setStartDate(undefined);
      setDurationDays(1);
      setDailyRate(0);
      setStatus('Unconfirmed');
      setPaymentStatus('Pending');
      setDepositEnabled(false);
      setDepositAmount(0);
      setHousekeepingEnabled(false);
      setHousekeepingAmount(0);
      setNotes('');
    }
  }, [open, units]);

  const endDate = useMemo(() => {
    if (!startDate) return null;
    return calculateEndDate(startDate, durationDays);
  }, [startDate, durationDays]);

  // CORRECTED: Total = Base + Housekeeping (NO Deposit - it's refundable)
  const totalAmount = useMemo(() => {
    const baseAmount = calculateTotalAmount(dailyRate, durationDays);
    const housekeeping = housekeepingEnabled ? housekeepingAmount : 0;
    // Deposit is NOT added to total rent as it's refundable
    return baseAmount + housekeeping;
  }, [dailyRate, durationDays, housekeepingEnabled, housekeepingAmount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitId || !tenantName.trim() || !startDate || !endDate) return;

    setLoading(true);
    try {
      await onSubmit({
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
      });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">{t('addBooking')}</DialogTitle>
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
                      {unit.name}
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
              <Label htmlFor="housekeeping" className="cursor-pointer">{t('housekeeping')}</Label>
              <Switch
                checked={housekeepingEnabled}
                onCheckedChange={setHousekeepingEnabled}
                id="housekeeping"
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

          {/* Deposit Toggle with Amount - REFUNDABLE NOTE */}
          <div className="space-y-3 rounded-lg border p-4 border-dashed">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label htmlFor="deposit" className="cursor-pointer">{t('deposit')}</Label>
                <span className="text-xs text-muted-foreground">(Refundable)</span>
              </div>
              <Switch
                checked={depositEnabled}
                onCheckedChange={setDepositEnabled}
                id="deposit"
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
                  <span>Deposit is not included in Total Rent (refundable)</span>
                </div>
              </>
            )}
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

          <div className="flex justify-end gap-3 pt-4">
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
                t('addBooking')
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
