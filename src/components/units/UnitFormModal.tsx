import { useState, useEffect } from 'react';
import { Unit, UnitType } from '@/types/database';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface UnitFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unit?: Unit | null;
  onSubmit: (data: { name: string; type: UnitType }) => Promise<void>;
}

const unitTypes: UnitType[] = ['Villa', 'Chalet', 'Palace'];

export const UnitFormModal = ({
  open,
  onOpenChange,
  unit,
  onSubmit,
}: UnitFormModalProps) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<UnitType>('Chalet');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (unit) {
      setName(unit.name);
      setType(unit.type);
    } else {
      setName('');
      setType('Chalet');
    }
  }, [unit, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      await onSubmit({ name: name.trim(), type });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            {unit ? 'Edit Unit' : 'Add New Unit'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Unit Name</Label>
            <Input
              id="name"
              placeholder="e.g., Sea View Chalet"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Unit Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as UnitType)}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {unitTypes.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="gradient-ocean">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : unit ? (
                'Save Changes'
              ) : (
                'Add Unit'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
