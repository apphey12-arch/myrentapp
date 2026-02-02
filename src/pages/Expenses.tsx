import { useState, useMemo } from 'react';
import { useExpenses } from '@/hooks/useExpenses';
import { useUnits } from '@/hooks/useUnits';
import { useBookings } from '@/hooks/useBookings';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Plus, CalendarIcon, Loader2, Trash2, Receipt, DollarSign, TrendingUp, TrendingDown, Download, FileText } from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { formatEGP, formatEGPCompact } from '@/lib/currency';
import { useLanguage } from '@/contexts/LanguageContext';
import { getUnitTypeEmoji } from '@/types/database';
import { generateFinancialReport, generateExpensesReport, PdfLanguage } from '@/lib/pdf';
import { PdfLanguageModal } from '@/components/pdf/PdfLanguageModal';
import { toast } from '@/hooks/use-toast';
import { DateRange } from 'react-day-picker';

const expenseCategories = [
  'Maintenance',
  'Electricity',
  'Water',
  'Utilities',
  'Cleaning',
  'Repairs',
  'Salaries',
  'Supplies',
  'Other',
];

interface UnitPerformanceData {
  unitName: string;
  unitType: string;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
}

const ExpensesPage = () => {
  const { t, isRTL } = useLanguage();
  const [unitFilter, setUnitFilter] = useState<string>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('expenses');
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [expensesPdfModalOpen, setExpensesPdfModalOpen] = useState(false);
  
  // Date range filter for expenses report
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  
  // Form state
  const [unitId, setUnitId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState('Maintenance');
  const [expenseDate, setExpenseDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const { units, isLoading: unitsLoading } = useUnits();
  const { expenses, isLoading: expensesLoading, createExpense, deleteExpense } = useExpenses();
  const { bookings, isLoading: bookingsLoading } = useBookings();

  const isLoading = unitsLoading || expensesLoading || bookingsLoading;

  // Calculate totals
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  // Filter expenses for display based on unit filter
  const filteredExpenses = useMemo(() => {
    let result = expenses;
    if (unitFilter && unitFilter !== 'all') {
      result = result.filter(e => e.unit_id === unitFilter);
    }
    return result;
  }, [expenses, unitFilter]);

  // Filter expenses by date range for PDF report
  const dateFilteredExpenses = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return filteredExpenses;
    return filteredExpenses.filter(expense => {
      const expenseDate = parseISO(expense.expense_date);
      return isWithinInterval(expenseDate, { start: dateRange.from!, end: dateRange.to! });
    });
  }, [filteredExpenses, dateRange]);

  // Translate category names
  const getCategoryLabel = (cat: string) => {
    const key = cat.toLowerCase();
    return t(key) || cat;
  };

  // Calculate unit performance data (Revenue = Base Rent ONLY, not housekeeping)
  const unitPerformanceData = useMemo((): UnitPerformanceData[] => {
    return units.map(unit => {
      // Revenue = sum of (daily_rate * duration_days) for non-cancelled bookings
      const unitBookings = bookings.filter(b => b.unit_id === unit.id && b.status !== 'Cancelled');
      const totalRevenue = unitBookings.reduce((sum, b) => sum + (b.daily_rate * b.duration_days), 0);
      
      // Expenses linked to this specific unit
      const unitExpenses = expenses.filter(e => e.unit_id === unit.id);
      const totalUnitExpenses = unitExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
      
      return {
        unitName: unit.name,
        unitType: unit.type,
        totalRevenue,
        totalExpenses: totalUnitExpenses,
        netProfit: totalRevenue - totalUnitExpenses,
      };
    });
  }, [units, bookings, expenses]);

  // Calculate totals for the performance report
  const performanceTotals = useMemo(() => {
    const totalRevenue = unitPerformanceData.reduce((sum, u) => sum + u.totalRevenue, 0);
    const totalExp = unitPerformanceData.reduce((sum, u) => sum + u.totalExpenses, 0);
    return {
      totalRevenue,
      totalExpenses: totalExp,
      netProfit: totalRevenue - totalExp,
    };
  }, [unitPerformanceData]);

  const resetForm = () => {
    setUnitId('');
    setDescription('');
    setAmount(0);
    setCategory('Maintenance');
    setExpenseDate(new Date());
    setNotes('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setLoading(true);
    try {
      await createExpense.mutateAsync({
        unit_id: unitId || null,
        description: description.trim(),
        amount,
        category,
        expense_date: format(expenseDate, 'yyyy-MM-dd'),
        notes: notes.trim() || undefined,
      });
      setFormOpen(false);
      resetForm();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(isRTL ? 'هل أنت متأكد من حذف هذا المصروف؟' : 'Are you sure you want to delete this expense?')) {
      await deleteExpense.mutateAsync(id);
    }
  };

  const handleExportReport = async (language: PdfLanguage) => {
    try {
      await generateFinancialReport(unitPerformanceData, performanceTotals, language);
      toast({
        title: isRTL ? 'تم تحميل التقرير' : 'Report Downloaded',
        description: isRTL ? 'تم إنشاء تقريرك المالي بنجاح.' : 'Your financial report has been generated successfully.',
      });
    } catch (error) {
      console.error('Failed to generate report:', error);
      toast({
        title: isRTL ? 'فشل التصدير' : 'Export Failed',
        description: isRTL ? 'فشل إنشاء التقرير. حاول مرة أخرى.' : 'Failed to generate the PDF. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleExportExpensesReport = async (language: PdfLanguage) => {
    try {
      await generateExpensesReport({
        expenses: dateFilteredExpenses,
        language,
        dateRange: dateRange?.from && dateRange?.to ? {
          from: dateRange.from,
          to: dateRange.to,
        } : undefined,
      });
      toast({
        title: isRTL ? 'تم تحميل تقرير المصروفات' : 'Expenses Report Downloaded',
        description: isRTL ? 'تم إنشاء تقرير المصروفات بنجاح.' : 'Your expenses report has been generated successfully.',
      });
    } catch (error) {
      console.error('Failed to generate expenses report:', error);
      toast({
        title: isRTL ? 'فشل التصدير' : 'Export Failed',
        description: isRTL ? 'فشل إنشاء تقرير المصروفات. حاول مرة أخرى.' : 'Failed to generate the expenses report. Please try again.',
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
            <h1 className="font-display text-3xl font-bold text-foreground">{t('expenses')}</h1>
            <p className="text-muted-foreground mt-1">{t('trackExpenses')}</p>
          </div>
          <Button onClick={() => setFormOpen(true)} className="gradient-ocean gap-2">
            <Plus className="h-4 w-4" />
            {t('addExpense')}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="shadow-soft">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
                  <DollarSign className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('totalExpenses')}</p>
                  <p className="text-xl font-bold text-foreground">{formatEGPCompact(totalExpenses)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Receipt className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('totalRecords')}</p>
                  <p className="text-xl font-bold text-foreground">{expenses.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
                  <TrendingUp className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('totalRevenue')}</p>
                  <p className="text-xl font-bold text-success">{formatEGPCompact(performanceTotals.totalRevenue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-xl",
                  performanceTotals.netProfit >= 0 ? "bg-success/10" : "bg-destructive/10"
                )}>
                  {performanceTotals.netProfit >= 0 ? (
                    <TrendingUp className="h-6 w-6 text-success" />
                  ) : (
                    <TrendingDown className="h-6 w-6 text-destructive" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('netProfit')}</p>
                  <p className={cn(
                    "text-xl font-bold",
                    performanceTotals.netProfit >= 0 ? "text-success" : "text-destructive"
                  )}>
                    {formatEGPCompact(performanceTotals.netProfit)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="expenses" className="gap-2">
              <Receipt className="h-4 w-4" />
              {t('expenses')}
            </TabsTrigger>
            <TabsTrigger value="performance" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              {t('unitPerformance')}
            </TabsTrigger>
          </TabsList>

          {/* Expenses Tab */}
          <TabsContent value="expenses" className="space-y-6">
            {/* Filters and Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
              <div className="flex flex-wrap items-center gap-3">
                {/* Unit Filter */}
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

                {/* Date Range Picker */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal min-w-[240px]",
                        !dateRange?.from && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="me-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd, y")} -{" "}
                            {format(dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>{t('pickDateRange')}</span>
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

              {/* Export Button */}
              <Button
                onClick={() => setExpensesPdfModalOpen(true)}
                variant="outline"
                className="gap-2"
                disabled={dateFilteredExpenses.length === 0}
              >
                <FileText className="h-4 w-4" />
                {t('downloadExpensesReport')}
              </Button>
            </div>

            {/* Expenses Table */}
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredExpenses.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>{t('noExpenses')}</p>
              </div>
            ) : (
              <Card className="shadow-soft">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('description')}</TableHead>
                      <TableHead>{t('unit')}</TableHead>
                      <TableHead>{t('category')}</TableHead>
                      <TableHead>{t('expenseDate')}</TableHead>
                      <TableHead className={cn(isRTL ? "text-left" : "text-right")}>{t('amount')}</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell className="font-medium">{expense.description}</TableCell>
                        <TableCell>
                          {expense.unit ? (
                            <span>{getUnitTypeEmoji(expense.unit.type)} {expense.unit.name}</span>
                          ) : (
                            <span className="text-muted-foreground">{t('general')}</span>
                          )}
                        </TableCell>
                        <TableCell>{getCategoryLabel(expense.category)}</TableCell>
                        <TableCell>{format(new Date(expense.expense_date), 'MMM d, yyyy')}</TableCell>
                        <TableCell className={cn("font-semibold text-destructive", isRTL ? "text-left" : "text-right")}>
                          {formatEGP(expense.amount)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(expense.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>

          {/* Unit Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="flex justify-between items-center">
              <p className="text-muted-foreground">
                {t('revenueNote')}
              </p>
              <Button 
                onClick={() => setPdfModalOpen(true)}
                variant="outline"
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                {t('downloadReport')}
              </Button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : unitPerformanceData.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>{isRTL ? 'لا توجد وحدات. أضف وحدات أولاً لعرض الأداء.' : 'No units found. Add units first to see performance.'}</p>
              </div>
            ) : (
              <Card className="shadow-soft">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('unit')}</TableHead>
                      <TableHead>{t('unitType')}</TableHead>
                      <TableHead className={cn(isRTL ? "text-left" : "text-right")}>{t('totalRevenue')}</TableHead>
                      <TableHead className={cn(isRTL ? "text-left" : "text-right")}>{t('totalExpenses')}</TableHead>
                      <TableHead className={cn(isRTL ? "text-left" : "text-right")}>{t('netProfit')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unitPerformanceData.map((unit) => (
                      <TableRow key={unit.unitName}>
                        <TableCell className="font-medium">
                          {getUnitTypeEmoji(unit.unitType as any)} {unit.unitName}
                        </TableCell>
                        <TableCell>{t(unit.unitType.toLowerCase())}</TableCell>
                        <TableCell className={cn("text-success font-semibold", isRTL ? "text-left" : "text-right")}>
                          {formatEGP(unit.totalRevenue)}
                        </TableCell>
                        <TableCell className={cn("text-destructive font-semibold", isRTL ? "text-left" : "text-right")}>
                          {formatEGP(unit.totalExpenses)}
                        </TableCell>
                        <TableCell className={cn(
                          "font-bold",
                          unit.netProfit >= 0 ? "text-success" : "text-destructive",
                          isRTL ? "text-left" : "text-right"
                        )}>
                          {unit.netProfit >= 0 ? '+' : ''}{formatEGP(unit.netProfit)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Totals Row */}
                    <TableRow className="bg-muted/50 font-bold">
                      <TableCell colSpan={2}>{t('total')}</TableCell>
                      <TableCell className={cn("text-success", isRTL ? "text-left" : "text-right")}>
                        {formatEGP(performanceTotals.totalRevenue)}
                      </TableCell>
                      <TableCell className={cn("text-destructive", isRTL ? "text-left" : "text-right")}>
                        {formatEGP(performanceTotals.totalExpenses)}
                      </TableCell>
                      <TableCell className={cn(
                        performanceTotals.netProfit >= 0 ? "text-success" : "text-destructive",
                        isRTL ? "text-left" : "text-right"
                      )}>
                        {performanceTotals.netProfit >= 0 ? '+' : ''}{formatEGP(performanceTotals.netProfit)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Add Expense Modal */}
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display">{t('addExpense')}</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>{t('expenseName')}</Label>
                <Input
                  placeholder={isRTL ? 'مثال: صيانة، كهرباء، قسط' : 'e.g. Electricity, Maintenance, Installment'}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('selectUnit')}</Label>
                  <Select value={unitId} onValueChange={setUnitId}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('general')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">{t('general')}</SelectItem>
                      {units.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {getUnitTypeEmoji(unit.type)} {unit.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('category')}</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {getCategoryLabel(cat)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('amount')} (EGP)</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('expenseDate')}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !expenseDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="me-2 h-4 w-4" />
                        {expenseDate ? format(expenseDate, 'PPP') : (isRTL ? 'اختر تاريخ' : 'Pick a date')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={expenseDate}
                        onSelect={(d) => d && setExpenseDate(d)}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
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

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFormOpen(false)}
                >
                  {t('cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !description.trim()}
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
          </DialogContent>
        </Dialog>

        {/* PDF Language Selection Modal - Financial Report */}
        <PdfLanguageModal
          open={pdfModalOpen}
          onOpenChange={setPdfModalOpen}
          onConfirm={handleExportReport}
          title={isRTL ? 'تصدير التقرير المالي' : 'Export Financial Report'}
        />

        {/* PDF Language Selection Modal - Expenses Report */}
        <PdfLanguageModal
          open={expensesPdfModalOpen}
          onOpenChange={setExpensesPdfModalOpen}
          onConfirm={handleExportExpensesReport}
          title={isRTL ? 'تصدير تقرير المصروفات' : 'Export Expenses Report'}
        />
      </div>
    </AppLayout>
  );
};

export default ExpensesPage;
