import { useState, useMemo } from 'react';
import { useBookings } from '@/hooks/useBookings';
import { useUnits } from '@/hooks/useUnits';
import { useExpenses } from '@/hooks/useExpenses';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarIcon, Loader2, TrendingUp, Calendar as CalendarIconLucide, DollarSign, Building2, FileText, Download } from 'lucide-react';
import { format, parseISO, isWithinInterval, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import { formatEGP, formatEGPCompact } from '@/lib/currency';
import { formatDateRange } from '@/lib/date-utils';
import { DateRange } from 'react-day-picker';
import { useLanguage } from '@/contexts/LanguageContext';
import { getUnitTypeEmoji } from '@/types/database';
import { PdfLanguageModal } from '@/components/pdf/PdfLanguageModal';
import { generateBookingsReport, PdfLanguage } from '@/lib/pdf';
import { toast } from '@/hooks/use-toast';

interface UnitPerformanceData {
  unitName: string;
  unitType: string;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
}

const ReportsPage = () => {
  const { t } = useLanguage();
  const [unitFilter, setUnitFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [pdfModalOpen, setPdfModalOpen] = useState(false);

  const { units, isLoading: unitsLoading } = useUnits();
  const { bookings, isLoading: bookingsLoading } = useBookings();
  const { expenses } = useExpenses();

  const isLoading = unitsLoading || bookingsLoading;

  // Filter bookings by date range and unit
  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      if (unitFilter !== 'all' && booking.unit_id !== unitFilter) {
        return false;
      }

      if (dateRange?.from && dateRange?.to) {
        const startDate = parseISO(booking.start_date);
        const endDate = parseISO(booking.end_date);
        
        const rangeOverlaps = 
          isWithinInterval(startDate, { start: dateRange.from, end: dateRange.to }) ||
          isWithinInterval(endDate, { start: dateRange.from, end: dateRange.to }) ||
          (startDate <= dateRange.from && endDate >= dateRange.to);

        if (!rangeOverlaps) return false;
      }

      return true;
    });
  }, [bookings, unitFilter, dateRange]);

  // Calculate stats
  const stats = useMemo(() => {
    const activeBookings = filteredBookings.filter(b => b.status !== 'Cancelled');

    // Revenue = Base Rent only (Daily Rate * Days). Housekeeping is pass-through.
    const totalRevenue = activeBookings.reduce((sum, b) => sum + (Number(b.daily_rate) * Number(b.duration_days)), 0);

    const occupiedDays = activeBookings.reduce(
      (sum, b) => sum + b.duration_days,
      0
    );

    const avgDailyRate = activeBookings.length > 0
      ? activeBookings.reduce((sum, b) => sum + Number(b.daily_rate), 0) / activeBookings.length
      : 0;

    return {
      totalRevenue,
      totalBookings: filteredBookings.length,
      occupiedDays,
      avgDailyRate,
      confirmedBookings: filteredBookings.filter(b => b.status === 'Confirmed').length,
    };
  }, [filteredBookings]);

  // Calculate unit performance data
  const unitPerformanceData = useMemo((): UnitPerformanceData[] => {
    return units.map(unit => {
      // Revenue from this unit
      const unitBookings = bookings.filter(b => b.unit_id === unit.id && b.status !== 'Cancelled');
      const totalRevenue = unitBookings.reduce((sum, b) => sum + (Number(b.daily_rate) * Number(b.duration_days)), 0);
      
      // Expenses for this unit
      const unitExpenses = expenses.filter(e => e.unit_id === unit.id);
      const totalExpenses = unitExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
      
      return {
        unitName: unit.name,
        unitType: unit.type,
        totalRevenue,
        totalExpenses,
        netProfit: totalRevenue - totalExpenses,
      };
    });
  }, [units, bookings, expenses]);

  // Generate date range label for PDF
  const dateRangeLabel = useMemo(() => {
    if (dateRange?.from && dateRange?.to) {
      return `${format(dateRange.from, 'MMM d, yyyy')} - ${format(dateRange.to, 'MMM d, yyyy')}`;
    }
    return 'All Time';
  }, [dateRange]);

  // Handle PDF export
  const handleExportPdf = async (language: PdfLanguage) => {
    try {
      const activeBookings = filteredBookings.filter(b => b.status !== 'Cancelled');
      const totalRevenue = activeBookings.reduce(
        (sum, b) => sum + (Number(b.daily_rate) * Number(b.duration_days)),
        0
      );

      await generateBookingsReport({
        bookings: activeBookings,
        dateRangeLabel,
        totalRevenue,
        language,
      });

      toast({
        title: 'Report Downloaded',
        description: 'Your detailed bookings report has been generated successfully.',
      });
    } catch (error) {
      console.error('Failed to generate report:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to generate the PDF. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">{t('reports')}</h1>
            <p className="text-muted-foreground mt-1">Financial analytics and insights</p>
          </div>
          <Button 
            onClick={() => setPdfModalOpen(true)}
            className="gradient-ocean gap-2"
          >
            <Download className="h-4 w-4" />
            Download Detailed PDF Report
          </Button>
        </div>

        {/* Filters */}
        <Card className="shadow-soft mb-8">
          <CardHeader>
            <CardTitle className="text-lg">{t('filter')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Date Range</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-[280px] justify-start text-left font-normal',
                        !dateRange && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, 'LLL dd, y')} -{' '}
                            {format(dateRange.to, 'LLL dd, y')}
                          </>
                        ) : (
                          format(dateRange.from, 'LLL dd, y')
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('unit')}</label>
                <Select value={unitFilter} onValueChange={setUnitFilter}>
                  <SelectTrigger className="w-[200px]">
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
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Revenue Overview
            </TabsTrigger>
            <TabsTrigger value="units" className="gap-2">
              <Building2 className="h-4 w-4" />
              Unit Performance
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                  <Card className="shadow-soft">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-ocean">
                          <DollarSign className="h-7 w-7 text-primary-foreground" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{t('totalRevenue')}</p>
                          <p className="text-2xl font-bold text-foreground">
                            {formatEGPCompact(stats.totalRevenue)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-soft">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10">
                          <CalendarIconLucide className="h-7 w-7 text-success" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Occupied Days</p>
                          <p className="text-2xl font-bold text-foreground">
                            {stats.occupiedDays} days
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-soft">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-warning/10">
                          <TrendingUp className="h-7 w-7 text-warning" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{t('avgDailyRate')}</p>
                          <p className="text-2xl font-bold text-foreground">
                            {formatEGP(stats.avgDailyRate)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-soft">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/20">
                          <FileText className="h-7 w-7 text-accent-foreground" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{t('totalBookings')}</p>
                          <p className="text-2xl font-bold text-foreground">
                            {stats.totalBookings}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Bookings List */}
                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle>Bookings in Range</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {filteredBookings.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        {t('noData')}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredBookings.slice(0, 10).map((booking) => (
                          <div
                            key={booking.id}
                            className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <div>
                                <p className="font-medium">
                                  {booking.unit?.type && getUnitTypeEmoji(booking.unit.type)} {booking.unit?.name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {booking.tenant_name} • {formatDateRange(booking.start_date, booking.end_date)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-primary">
                                {formatEGP(booking.total_amount)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {booking.duration_days} days @ {formatEGP(booking.daily_rate)}/day
                              </p>
                            </div>
                          </div>
                        ))}
                        {filteredBookings.length > 10 && (
                          <p className="text-center text-sm text-muted-foreground pt-2">
                            And {filteredBookings.length - 10} more bookings...
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Unit Performance Tab */}
          <TabsContent value="units">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle>Unit Financials</CardTitle>
                </CardHeader>
                <CardContent>
                  {unitPerformanceData.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No units found. Add units to see performance data.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t('unit')}</th>
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t('type')}</th>
                            <th className="text-right py-3 px-4 font-medium text-muted-foreground">{t('totalRevenue')}</th>
                            <th className="text-right py-3 px-4 font-medium text-muted-foreground">{t('totalExpenses')}</th>
                            <th className="text-right py-3 px-4 font-medium text-muted-foreground">Net Profit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {unitPerformanceData.map((unit) => (
                            <tr key={unit.unitName} className="border-b hover:bg-secondary/30 transition-colors">
                              <td className="py-3 px-4 font-medium">
                                {getUnitTypeEmoji(unit.unitType as any)} {unit.unitName}
                              </td>
                              <td className="py-3 px-4 text-muted-foreground">{unit.unitType}</td>
                              <td className="py-3 px-4 text-right text-success font-semibold">
                                {formatEGP(unit.totalRevenue)}
                              </td>
                              <td className="py-3 px-4 text-right text-destructive font-semibold">
                                {formatEGP(unit.totalExpenses)}
                              </td>
                              <td className={cn(
                                "py-3 px-4 text-right font-bold",
                                unit.netProfit >= 0 ? "text-success" : "text-destructive"
                              )}>
                                {unit.netProfit >= 0 ? '+' : ''}{formatEGP(unit.netProfit)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* PDF Language Modal */}
        <PdfLanguageModal
          open={pdfModalOpen}
          onOpenChange={setPdfModalOpen}
          onConfirm={handleExportPdf}
          title="Export Bookings Report"
        />
      </div>
    </AppLayout>
  );
};

export default ReportsPage;
