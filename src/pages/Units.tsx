import { useState } from 'react';
import { useUnits } from '@/hooks/useUnits';
import { AppLayout } from '@/components/layout/AppLayout';
import { UnitCard } from '@/components/units/UnitCard';
import { UnitFormModal } from '@/components/units/UnitFormModal';
import { Button } from '@/components/ui/button';
import { Plus, Building, Loader2 } from 'lucide-react';
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

const UnitsPage = () => {
  const { t } = useLanguage();
  const { units, isLoading, createUnit, updateUnit, deleteUnit } = useUnits();
  const [formOpen, setFormOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

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
            <h2 className="text-xl font-semibold mb-2">No units yet</h2>
            <p className="text-muted-foreground mb-6">
              Add your first property to get started with bookings
            </p>
            <Button onClick={() => setFormOpen(true)} className="gradient-ocean gap-2">
              <Plus className="h-4 w-4" />
              Add Your First Unit
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {units.map((unit) => (
              <UnitCard
                key={unit.id}
                unit={unit}
                onEdit={handleEdit}
                onDelete={(id) => setDeleteId(id)}
              />
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

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Unit?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this unit and all associated bookings.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
};

export default UnitsPage;
