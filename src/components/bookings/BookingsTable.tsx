import { Booking } from '@/types/database';
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

interface BookingsTableProps {
  bookings: Booking[];
  onBookingClick: (booking: Booking) => void;
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

export const BookingsTable = ({ bookings, onBookingClick }: BookingsTableProps) => {
  if (bookings.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No bookings found. Create your first booking!</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border shadow-soft overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="font-semibold">Unit</TableHead>
            <TableHead className="font-semibold">Tenant</TableHead>
            <TableHead className="font-semibold">Dates</TableHead>
            <TableHead className="font-semibold text-right">Daily Rate</TableHead>
            <TableHead className="font-semibold text-right">Total</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
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
                {booking.unit?.name || 'Unknown'}
              </TableCell>
              <TableCell>{booking.tenant_name}</TableCell>
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
