import { useState, useMemo } from 'react';
import { useUnits } from '@/hooks/useUnits';
import { useBookings } from '@/hooks/useBookings';
import { useExpenses } from '@/hooks/useExpenses';
import { AppLayout } from '@/components/layout/AppLayout';
import { UnitCard } from '@/components/units/UnitCard';
import { UnitFormModal } from '@/components/units/UnitFormModal';
import { UnitProfitabilityCard } from '@/components/units/UnitProfitabilityCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Building, Loader2, X } from 'lucide-react';
import { Unit, UnitType, getUnitTypeEmoji } from '@/types/database';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatEGP } from '@/lib/currency';

const UnitsPage = () => {
  const { t } = useLanguage();
  const { units, isLoading, createUnit, updateUnit, deleteUnit } = useUnits();
  const { bookings } = useBookings();
  const { expenses } = useExpenses();
  
  const [formOpen, setFormOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [detailUnit, setDetailUnit] = useState<Unit | null>(null);

  // Calculate profitability for each unit
  const unitFinancials = useMemo(() => {
    const financials: Record<string, { revenue: number; expenses: number }> = {};
    
    units.forEach(unit => {
      // Calculate revenue from bookings for this unit (excluding cancelled)
      const unitRevenue = bookings
        .filter(b => b.unit_id === unit.id && b.status !== 'Cancelled')
        .reduce((sum, b) => sum + Number(b.total_amount), 0);
      
      // Calculate expenses for this unit
      const unitExpenses = expenses
        .filter(e => e.unit_id === unit.id)
        .reduce((sum, e) => sum + Number(e.amount), 0);
      
      financials[unit.id] = {
        revenue: unitRevenue,
        expenses: unitExpenses,
      };
    });
    
    return financials;
  }, [units, bookings, expenses]);

  const handleCreate = async (data: { name: string; type: UnitType }) => {
    await createUnit.mutateAsync(data);
  };

  const handleUpdate = async (data: { name: string; type: UnitType }) => {
    if (!editingUnit) return;
    await updateUnit.mutateAsync({ id: editingUnit.id, ...data });
  };

  const handleEdit = (unit: Unit) => {
    setEditingUnit(unit);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteUnit.mutateAsync(deleteId);
    setDeleteId(null);
  };

  const handleFormClose = (open: boolean) => {
    setFormOpen(open);
    if (!open) setEditingUnit(null);
  };

  const handleUnitClick = (unit: Unit) => {
    setDetailUnit(unit);
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">{t('myUnits')}</h1>
            <p className="text-muted-foreground mt-1">Manage your properties</p>
          </div>
          <Button onClick={() => setFormOpen(true)} className="gradient-ocean gap-2">
            <Plus className="h-4 w-4" />
            {t('add')} {t('unit')}
          </Button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : units.length === 0 ? (
          <div className="text-center py-20">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Building className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">{t('noUnitsFound')}</h2>
            <p className="text-muted-foreground mb-6">
              Add your first property to get started with bookings
            </p>
            <Button onClick={() => setFormOpen(true)} className="gradient-ocean gap-2">
              <Plus className="h-4 w-4" />
              {t('addFirstUnit')}
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {units.map((unit) => (
              <div key={unit.id} onClick={() => handleUnitClick(unit)} className="cursor-pointer">
                <UnitCard
                  unit={unit}
                  onEdit={handleEdit}
                  onDelete={(id) => setDeleteId(id)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Form Modal */}
        <UnitFormModal
          open={formOpen}
          onOpenChange={handleFormClose}
          unit={editingUnit}
          onSubmit={editingUnit ? handleUpdate : handleCreate}
        />

        {/* Unit Detail Modal with Profitability */}
        <Dialog open={!!detailUnit} onOpenChange={() => setDetailUnit(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display flex items-center gap-2">
                {detailUnit?.type && getUnitTypeEmoji(detailUnit.type)}
                <span>{detailUnit?.name}</span>
              </DialogTitle>
            </DialogHeader>

            {detailUnit && (
              <div className="space-y-4 mt-4">
                <div className="p-4 rounded-lg bg-secondary/30">
                  <p className="text-sm text-muted-foreground">{t('unitType')}</p>
                  <p className="font-medium">{detailUnit.type}</p>
                </div>

                {/* Profitability Card */}
                <UnitProfitabilityCard
                  unit={detailUnit}
                  revenue={unitFinancials[detailUnit.id]?.revenue || 0}
                  expenses={unitFinancials[detailUnit.id]?.expenses || 0}
                />

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setDetailUnit(null);
                      handleEdit(detailUnit);
                    }}
                  >
                    {t('edit')}
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => {
                      setDetailUnit(null);
                      setDeleteId(detailUnit.id);
                    }}
                  >
                    {t('delete')}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('delete')} {t('unit')}?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this unit and all associated bookings.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive hover:bg-destructive/90"
              >
                {t('delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
};

export default UnitsPage;
