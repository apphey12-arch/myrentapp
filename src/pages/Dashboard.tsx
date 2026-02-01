import { useState } from 'react';
import { useBookings } from '@/hooks/useBookings';
import { useUnits } from '@/hooks/useUnits';
import { AppLayout } from '@/components/layout/AppLayout';
import { BookingsTable } from '@/components/bookings/BookingsTable';
import { BookingFormModal } from '@/components/bookings/BookingFormModal';
import { BookingDetailModal } from '@/components/bookings/BookingDetailModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, CalendarDays, DollarSign, TrendingUp, Loader2, Building } from 'lucide-react';
import { Booking } from '@/types/database';
import { formatEGP, formatEGPCompact } from '@/lib/currency';
import { Link } from 'react-router-dom';

const DashboardPage = () => {
  const [unitFilter, setUnitFilter] = useState<string>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const { units, isLoading: unitsLoading } = useUnits();
  const { bookings, isLoading: bookingsLoading, createBooking, updateBooking, deleteBooking } = useBookings(unitFilter);

  const isLoading = unitsLoading || bookingsLoading;

  // Stats calculations
  const activeBookings = bookings.filter(b => b.status !== 'Cancelled');
  const totalRevenue = activeBookings.reduce((sum, b) => sum + Number(b.total_amount), 0);
  const confirmedCount = bookings.filter(b => b.status === 'Confirmed').length;
  const avgDailyRate = activeBookings.length > 0
    ? activeBookings.reduce((sum, b) => sum + Number(b.daily_rate), 0) / activeBookings.length
    : 0;

  const handleCreateBooking = async (data: any) => {
    await createBooking.mutateAsync(data);
  };

  const handleUpdateBooking = async (data: any) => {
    await updateBooking.mutateAsync(data);
  };

  const handleDeleteBooking = async (id: string) => {
    await deleteBooking.mutateAsync(id);
  };

  if (units.length === 0 && !unitsLoading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[80vh] p-6">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
            <Building className="h-10 w-10 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-bold mb-2">No Units Found</h1>
          <p className="text-muted-foreground text-center mb-6 max-w-md">
            You need to add at least one unit before creating bookings.
          </p>
          <Link to="/units">
            <Button className="gradient-ocean gap-2">
              <Plus className="h-4 w-4" />
              Add Your First Unit
            </Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Overview of your bookings</p>
          </div>
          <Button onClick={() => setFormOpen(true)} className="gradient-ocean gap-2">
            <Plus className="h-4 w-4" />
            Add Booking
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="shadow-soft hover:shadow-medium transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-xl font-bold text-foreground">{formatEGPCompact(totalRevenue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-medium transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
                  <CalendarDays className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Bookings</p>
                  <p className="text-xl font-bold text-foreground">{bookings.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-medium transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10">
                  <TrendingUp className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Confirmed</p>
                  <p className="text-xl font-bold text-foreground">{confirmedCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-medium transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/20">
                  <DollarSign className="h-6 w-6 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Daily Rate</p>
                  <p className="text-xl font-bold text-foreground">{formatEGP(avgDailyRate)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-4 mb-6">
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

        {/* Bookings Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <BookingsTable
            bookings={bookings}
            onBookingClick={(booking) => setSelectedBooking(booking)}
          />
        )}

        {/* Modals */}
        <BookingFormModal
          open={formOpen}
          onOpenChange={setFormOpen}
          units={units}
          onSubmit={handleCreateBooking}
        />

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

export default DashboardPage;
