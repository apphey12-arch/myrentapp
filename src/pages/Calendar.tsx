import { useMemo, useState, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, parseISO } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { useBookings } from '@/hooks/useBookings';
import { useUnits } from '@/hooks/useUnits';
import { AppLayout } from '@/components/layout/AppLayout';
import { BookingDetailModal } from '@/components/bookings/BookingDetailModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Loader2 } from 'lucide-react';
import { Booking, getUnitTypeEmoji } from '@/types/database';
import { formatEGP } from '@/lib/currency';
import { useLanguage } from '@/contexts/LanguageContext';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  booking: Booking;
}

const CalendarPage = () => {
  const { t } = useLanguage();
  const [unitFilter, setUnitFilter] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());

  const { units, isLoading: unitsLoading } = useUnits();
  const { bookings, isLoading: bookingsLoading, updateBooking, deleteBooking } = useBookings(unitFilter);

  const isLoading = unitsLoading || bookingsLoading;

  const events = useMemo<CalendarEvent[]>(() => {
    return bookings.map((booking) => ({
      id: booking.id,
      title: `${booking.unit?.name || 'Unknown'} - ${booking.tenant_name}`,
      start: parseISO(booking.start_date),
      end: parseISO(booking.end_date),
      booking,
    }));
  }, [bookings]);

  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    let backgroundColor = '#fbbf24'; // default warning/unconfirmed
    let className = 'unconfirmed';

    switch (event.booking.status) {
      case 'Confirmed':
        backgroundColor = '#16a34a';
        className = 'confirmed';
        break;
      case 'Cancelled':
        backgroundColor = '#94a3b8';
        className = 'cancelled';
        break;
      case 'Unconfirmed':
        backgroundColor = '#fbbf24';
        className = 'unconfirmed';
        break;
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '6px',
        opacity: event.booking.status === 'Cancelled' ? 0.6 : 1,
        color: event.booking.status === 'Unconfirmed' ? '#1a1a1a' : '#fff',
        border: 'none',
        display: 'block',
      },
      className,
    };
  }, []);

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedBooking(event.booking);
  }, []);

  const handleUpdateBooking = async (data: any) => {
    await updateBooking.mutateAsync(data);
  };

  const handleDeleteBooking = async (id: string) => {
    await deleteBooking.mutateAsync(id);
  };

  const EventComponent = ({ event }: { event: CalendarEvent }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="truncate px-1 py-0.5 text-xs font-medium">
            {event.booking.unit?.name} - {event.booking.tenant_name}
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold">{event.booking.unit?.name}</p>
            <p>Tenant: {event.booking.tenant_name}</p>
            <p className="font-medium text-primary">
              Total: {formatEGP(event.booking.total_amount)}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <AppLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">{t('calendar')}</h1>
            <p className="text-muted-foreground mt-1">Visual overview of all bookings</p>
          </div>

          <Select value={unitFilter} onValueChange={setUnitFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by unit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Units</SelectItem>
              {units.map((unit) => (
                <SelectItem key={unit.id} value={unit.id}>
                  {unit.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-success" />
            <span className="text-sm text-muted-foreground">Confirmed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-warning" />
            <span className="text-sm text-muted-foreground">Unconfirmed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-muted" />
            <span className="text-sm text-muted-foreground">Cancelled</span>
          </div>
        </div>

        {/* Calendar */}
        <Card className="shadow-soft">
          <CardContent className="p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="h-[600px]">
                <Calendar
                  localizer={localizer}
                  events={events}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ height: '100%' }}
                  eventPropGetter={eventStyleGetter}
                  onSelectEvent={handleSelectEvent}
                  view={view}
                  onView={setView}
                  date={date}
                  onNavigate={setDate}
                  components={{
                    event: EventComponent,
                  }}
                  popup
                  selectable={false}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Booking Detail Modal */}
        <BookingDetailModal
          open={!!selectedBooking}
          onOpenChange={(open) => !open && setSelectedBooking(null)}
          booking={selectedBooking}
          units={units}
          onUpdate={handleUpdateBooking}
          onDelete={handleDeleteBooking}
        />
      </div>
    </AppLayout>
  );
};

export default CalendarPage;
