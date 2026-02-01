import { useState, useEffect, useMemo } from 'react';
import { Booking, BookingStatus, Unit } from '@/types/database';
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
import { Loader2, CalendarIcon } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { formatEGP } from '@/lib/currency';
import { calculateEndDate, calculateTotalAmount } from '@/lib/date-utils';
import { CreateBookingData } from '@/hooks/useBookings';

interface BookingFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  units: Unit[];
  onSubmit: (data: CreateBookingData) => Promise<void>;
}

const statusOptions: BookingStatus[] = ['Unconfirmed', 'Confirmed', 'Cancelled'];

export const BookingFormModal = ({
  open,
  onOpenChange,
  units,
  onSubmit,
}: BookingFormModalProps) => {
  const [unitId, setUnitId] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [startDate, setStartDate] = useState<Date>();
  const [durationDays, setDurationDays] = useState(1);
  const [dailyRate, setDailyRate] = useState(0);
  const [status, setStatus] = useState<BookingStatus>('Unconfirmed');
  const [depositPaid, setDepositPaid] = useState(false);
  const [housekeepingRequired, setHousekeepingRequired] = useState(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setUnitId(units[0]?.id || '');
      setTenantName('');
      setStartDate(undefined);
      setDurationDays(1);
      setDailyRate(0);
      setStatus('Unconfirmed');
      setDepositPaid(false);
      setHousekeepingRequired(false);
      setNotes('');
    }
  }, [open, units]);

  const endDate = useMemo(() => {
    if (!startDate) return null;
    return calculateEndDate(startDate, durationDays);
  }, [startDate, durationDays]);

  const totalAmount = useMemo(() => {
    return calculateTotalAmount(dailyRate, durationDays);
  }, [dailyRate, durationDays]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitId || !tenantName.trim() || !startDate || !endDate) return;

    setLoading(true);
    try {
      await onSubmit({
        unit_id: unitId,
        tenant_name: tenantName.trim(),
        start_date: format(startDate, 'yyyy-MM-dd'),
        duration_days: durationDays,
        end_date: format(endDate, 'yyyy-MM-dd'),
        daily_rate: dailyRate,
        total_amount: totalAmount,
        status,
        deposit_paid: depositPaid,
        housekeeping_required: housekeepingRequired,
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
          <DialogTitle className="font-display">Add New Booking</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Unit</Label>
              <Select value={unitId} onValueChange={setUnitId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
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
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as BookingStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tenant Name</Label>
            <Input
              placeholder="Enter tenant name"
              value={tenantName}
              onChange={(e) => setTenantName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !startDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'PPP') : 'Pick a date'}
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
              <Label>Duration (Days)</Label>
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
              <span className="text-muted-foreground">End Date: </span>
              <span className="font-medium">{format(endDate, 'PPP')}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Daily Rate (EGP)</Label>
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
              <Label>Total Amount</Label>
              <div className="flex h-10 items-center rounded-md border bg-muted/50 px-3 font-semibold text-primary">
                {formatEGP(totalAmount)}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                checked={depositPaid}
                onCheckedChange={setDepositPaid}
                id="deposit"
              />
              <Label htmlFor="deposit">Deposit Paid</Label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={housekeepingRequired}
                onCheckedChange={setHousekeepingRequired}
                id="housekeeping"
              />
              <Label htmlFor="housekeeping">Housekeeping</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              placeholder="Any special requirements..."
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
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !unitId || !startDate}
              className="gradient-ocean"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Create Booking'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
