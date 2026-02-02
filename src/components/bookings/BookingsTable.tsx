import { Booking, PaymentStatus, getUnitTypeEmoji } from '@/types/database';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatEGP } from '@/lib/currency';
import { formatDateRange } from '@/lib/date-utils';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { MessageCircle } from 'lucide-react';

interface BookingsTableProps {
  bookings: Booking[];
  onBookingClick: (booking: Booking) => void;
  onTenantClick?: (booking: Booking) => void;
}

const getStatusStyles = (status: string) => {
  switch (status) {
    case 'Confirmed':
      return 'bg-success/10 text-success border-success/20';
    case 'Unconfirmed':
      return 'bg-warning/10 text-warning-foreground border-warning/20';
    case 'Cancelled':
      return 'bg-muted text-muted-foreground border-muted';
    default:
      return '';
  }
};

const getPaymentStatusStyles = (status: PaymentStatus) => {
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

export const BookingsTable = ({ bookings, onBookingClick, onTenantClick }: BookingsTableProps) => {
  const { t } = useLanguage();

  if (bookings.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>{t('noData')}</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block rounded-xl border shadow-soft overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="font-semibold">{t('unit')}</TableHead>
              <TableHead className="font-semibold">{t('tenantName')}</TableHead>
              <TableHead className="font-semibold">{t('phoneNumber')}</TableHead>
              <TableHead className="font-semibold">Dates</TableHead>
              <TableHead className="font-semibold text-right">{t('dailyRate')}</TableHead>
              <TableHead className="font-semibold text-right">{t('totalAmount')}</TableHead>
              <TableHead className="font-semibold">{t('status')}</TableHead>
              <TableHead className="font-semibold">{t('paymentStatus')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((booking) => (
              <TableRow
                key={booking.id}
                onClick={() => onBookingClick(booking)}
                className="cursor-pointer hover:bg-secondary/50 transition-colors"
              >
                <TableCell className="font-medium">
                  {booking.unit?.type && getUnitTypeEmoji(booking.unit.type)} {booking.unit?.name || 'Unknown'}
                </TableCell>
                <TableCell>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTenantClick?.(booking);
                    }}
                    className="text-primary hover:underline font-medium"
                  >
                    {booking.tenant_name}
                  </button>
                </TableCell>
                <TableCell>
                  {booking.phone_number ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{booking.phone_number}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openWhatsApp(booking.phone_number!, booking.tenant_name);
                        }}
                        className="text-green-500 hover:text-green-600"
                        title="Open WhatsApp"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDateRange(booking.start_date, booking.end_date)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatEGP(booking.daily_rate)}
                </TableCell>
                <TableCell className="text-right font-semibold text-primary">
                  {formatEGP(booking.total_amount)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn('font-medium', getStatusStyles(booking.status))}
                  >
                    {booking.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn('font-medium', getPaymentStatusStyles(booking.payment_status))}
                  >
                    {booking.payment_status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {bookings.map((booking) => (
          <div
            key={booking.id}
            onClick={() => onBookingClick(booking)}
            className="rounded-xl border shadow-soft p-4 cursor-pointer hover:bg-secondary/50 transition-colors"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-semibold">
                  {booking.unit?.type && getUnitTypeEmoji(booking.unit.type)} {booking.unit?.name || 'Unknown'}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTenantClick?.(booking);
                  }}
                  className="text-primary hover:underline text-sm"
                >
                  {booking.tenant_name}
                </button>
              </div>
              <div className="flex gap-2">
                <Badge
                  variant="outline"
                  className={cn('font-medium text-xs', getStatusStyles(booking.status))}
                >
                  {booking.status}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn('font-medium text-xs', getPaymentStatusStyles(booking.payment_status))}
                >
                  {booking.payment_status}
                </Badge>
              </div>
            </div>

            <div className="text-sm text-muted-foreground mb-2">
              {formatDateRange(booking.start_date, booking.end_date)}
            </div>

            {booking.phone_number && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-muted-foreground">{booking.phone_number}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openWhatsApp(booking.phone_number!, booking.tenant_name);
                  }}
                  className="text-green-500 hover:text-green-600"
                  title="Open WhatsApp"
                >
                  <MessageCircle className="h-4 w-4" />
                </button>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm text-muted-foreground">
                {formatEGP(booking.daily_rate)}/day
              </span>
              <span className="font-bold text-primary text-lg">
                {formatEGP(booking.total_amount)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};
