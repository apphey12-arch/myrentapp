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
import { Plus, CalendarIcon, Loader2, Trash2, Receipt, DollarSign, FileText, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { formatEGP, formatEGPCompact } from '@/lib/currency';
import { useLanguage } from '@/contexts/LanguageContext';
import { getUnitTypeEmoji } from '@/types/database';
import { generateUnitPerformancePDF, UnitPerformanceData } from '@/lib/pdf-generator';
import { PdfLanguageModal } from '@/components/pdf/PdfLanguageModal';

const expenseCategories = [
  'Maintenance',
  'Utilities',
  'Cleaning',
  'Repairs',
  'Supplies',
  'Insurance',
  'Taxes',
  'Marketing',
  'Other',
];

const ExpensesPage = () => {
  const { t } = useLanguage();
  const [unitFilter, setUnitFilter] = useState<string>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('expenses');
  
  // Form state
  const [unitId, setUnitId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState('General');
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
    if (unitFilter === 'all') return expenses;
    return expenses.filter(e => e.unit_id === unitFilter);
  }, [expenses, unitFilter]);

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
    setCategory('General');
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
    if (confirm('Are you sure you want to delete this expense?')) {
      await deleteExpense.mutateAsync(id);
    }
  };

  const handleExportUnitPerformance = () => {
    setPdfModalOpen(true);
  };

  const handlePdfGenerate = async (selectedLanguage: 'en' | 'ar') => {
    const dateRange = 'All Time';
    const housekeepingTotal = bookings
      .filter(b => b.status !== 'Cancelled')
      .reduce((sum, b) => sum + (b.housekeeping_amount || 0), 0);
    
    await generateUnitPerformancePDF(unitPerformanceData, dateRange, housekeepingTotal, selectedLanguage);
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">{t('expenses')}</h1>
            <p className="text-muted-foreground mt-1">Track your property expenses & performance</p>
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
                  <p className="text-sm text-muted-foreground">Total Records</p>
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
                  <p className="text-sm text-muted-foreground">Net Profit</p>
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
              Expenses
            </TabsTrigger>
            <TabsTrigger value="performance" className="gap-2">
              <FileText className="h-4 w-4" />
              Unit Performance
            </TabsTrigger>
          </TabsList>

          {/* Expenses Tab */}
          <TabsContent value="expenses" className="space-y-6">
            {/* Filter */}
            <div className="flex items-center gap-4">
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

            {/* Expenses Table */}
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredExpenses.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No expenses found. Add your first expense!</p>
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
                      <TableHead className="text-right">{t('amount')}</TableHead>
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
                            <span className="text-muted-foreground">General</span>
                          )}
                        </TableCell>
                        <TableCell>{expense.category}</TableCell>
                        <TableCell>{format(new Date(expense.expense_date), 'MMM d, yyyy')}</TableCell>
                        <TableCell className="text-right font-semibold text-destructive">
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
                View financial performance by unit. Revenue = Base Rent only (excludes housekeeping).
              </p>
              <Button onClick={handleExportUnitPerformance} variant="outline" className="gap-2">
                <FileText className="h-4 w-4" />
                Export Profit Report
              </Button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : unitPerformanceData.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No units found. Add units first to see performance.</p>
              </div>
            ) : (
              <Card className="shadow-soft">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('unit')}</TableHead>
                      <TableHead>{t('type')}</TableHead>
                      <TableHead className="text-right">{t('totalRevenue')}</TableHead>
                      <TableHead className="text-right">{t('totalExpenses')}</TableHead>
                      <TableHead className="text-right">Net Profit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unitPerformanceData.map((unit) => (
                      <TableRow key={unit.unitName}>
                        <TableCell className="font-medium">
                          {getUnitTypeEmoji(unit.unitType)} {unit.unitName}
                        </TableCell>
                        <TableCell>{unit.unitType}</TableCell>
                        <TableCell className="text-right text-success font-semibold">
                          {formatEGP(unit.totalRevenue)}
                        </TableCell>
                        <TableCell className="text-right text-destructive font-semibold">
                          {formatEGP(unit.totalExpenses)}
                        </TableCell>
                        <TableCell className={cn(
                          "text-right font-bold",
                          unit.netProfit >= 0 ? "text-success" : "text-destructive"
                        )}>
                          {unit.netProfit >= 0 ? '+' : ''}{formatEGP(unit.netProfit)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Totals Row */}
                    <TableRow className="bg-muted/50 font-bold">
                      <TableCell colSpan={2}>Total</TableCell>
                      <TableCell className="text-right text-success">
                        {formatEGP(performanceTotals.totalRevenue)}
                      </TableCell>
                      <TableCell className="text-right text-destructive">
                        {formatEGP(performanceTotals.totalExpenses)}
                      </TableCell>
                      <TableCell className={cn(
                        "text-right",
                        performanceTotals.netProfit >= 0 ? "text-success" : "text-destructive"
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
                <Label>{t('description')}</Label>
                <Input
                  placeholder={t('description')}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('unit')} (Optional)</Label>
                  <Select value={unitId || 'general'} onValueChange={(val) => setUnitId(val === 'general' ? '' : val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="General" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
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
                          {cat}
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
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {expenseDate ? format(expenseDate, 'PPP') : 'Pick date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={expenseDate}
                        onSelect={(d) => d && setExpenseDate(d)}
                        initialFocus
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
                <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                  {t('cancel')}
                </Button>
                <Button type="submit" disabled={loading} className="gradient-ocean">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('save')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* PDF Language Modal */}
        <PdfLanguageModal
          open={pdfModalOpen}
          onOpenChange={setPdfModalOpen}
          onConfirm={handlePdfGenerate}
          title="Export Unit Performance Report"
        />
      </div>
    </AppLayout>
  );
};

export default ExpensesPage;
