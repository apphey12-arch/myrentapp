import { useState } from 'react';
import { useBookings } from '@/hooks/useBookings';
import { useUnits } from '@/hooks/useUnits';
import { AppLayout } from '@/components/layout/AppLayout';
import { BookingsTable } from '@/components/bookings/BookingsTable';
import { BookingFormModal } from '@/components/bookings/BookingFormModal';
import { BookingDetailModal } from '@/components/bookings/BookingDetailModal';
import { TenantDetailModal } from '@/components/bookings/TenantDetailModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, CalendarDays, DollarSign, TrendingUp, Loader2, Building, Search } from 'lucide-react';
import { Booking, UnitType, getUnitTypeEmoji } from '@/types/database';
import { formatEGP, formatEGPCompact } from '@/lib/currency';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

const DashboardPage = () => {
  const { t } = useLanguage();
  const [unitFilter, setUnitFilter] = useState<string>('all');
  const [unitTypeFilter, setUnitTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [tenantDetailBooking, setTenantDetailBooking] = useState<Booking | null>(null);

  const { units, isLoading: unitsLoading } = useUnits();
  const { bookings, isLoading: bookingsLoading, createBooking, updateBooking, deleteBooking } = useBookings(unitFilter, searchQuery, unitTypeFilter);

  const isLoading = unitsLoading || bookingsLoading;

  // Stats calculations
  const activeBookings = bookings.filter(b => b.status !== 'Cancelled');
  // Revenue = Base Rent only (Daily Rate * Days). Housekeeping is pass-through.
  const totalRevenue = activeBookings.reduce(
    (sum, b) => sum + (Number(b.daily_rate) * Number(b.duration_days)),
    0
  );
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

  const unitTypes: UnitType[] = ['Villa', 'Chalet', 'Palace'];

  if (units.length === 0 && !unitsLoading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[80vh] p-6">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
            <Building className="h-10 w-10 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-bold mb-2">{t('noUnitsFound')}</h1>
          <p className="text-muted-foreground text-center mb-6 max-w-md">
            You need to add at least one unit before creating bookings.
          </p>
          <Link to="/units">
            <Button className="gradient-ocean gap-2">
              <Plus className="h-4 w-4" />
              {t('addFirstUnit')}
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
            <h1 className="font-display text-3xl font-bold text-foreground">{t('dashboard')}</h1>
            <p className="text-muted-foreground mt-1">{t('overview')}</p>
          </div>
          <Button onClick={() => setFormOpen(true)} className="gradient-ocean gap-2">
            <Plus className="h-4 w-4" />
            {t('addBooking')}
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
                  <p className="text-sm text-muted-foreground">{t('totalRevenue')}</p>
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
                  <p className="text-sm text-muted-foreground">{t('totalBookings')}</p>
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
                  <p className="text-sm text-muted-foreground">{t('confirmed')}</p>
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
                  <p className="text-sm text-muted-foreground">{t('avgDailyRate')}</p>
                  <p className="text-xl font-bold text-foreground">{formatEGP(avgDailyRate)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('searchByNameOrPhone')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={unitFilter} onValueChange={setUnitFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('filterByUnit')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allUnits')}</SelectItem>
              {units.map((unit) => (
                <SelectItem key={unit.id} value={unit.id}>
                  {getUnitTypeEmoji(unit.type)} {unit.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={unitTypeFilter} onValueChange={setUnitTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('filterByUnitType')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allTypes')}</SelectItem>
              {unitTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {getUnitTypeEmoji(type)} {t(type.toLowerCase())}
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
            onTenantClick={(booking) => setTenantDetailBooking(booking)}
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

        <TenantDetailModal
          open={!!tenantDetailBooking}
          onOpenChange={(open) => !open && setTenantDetailBooking(null)}
          booking={tenantDetailBooking}
        />
      </div>
    </AppLayout>
  );
};

export default DashboardPage;
