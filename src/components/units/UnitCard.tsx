import { Unit, getUnitTypeEmoji } from '@/types/database';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Home, Castle, Building, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UnitCardProps {
  unit: Unit;
  onEdit: (unit: Unit) => void;
  onDelete: (id: string) => void;
}

const unitIcons = {
  Villa: Home,
  Chalet: Building,
  Palace: Castle,
};

const unitColors = {
  Villa: 'bg-success/10 text-success',
  Chalet: 'bg-primary/10 text-primary',
  Palace: 'bg-accent/10 text-accent-foreground',
};

export const UnitCard = ({ unit, onEdit, onDelete }: UnitCardProps) => {
  const Icon = unitIcons[unit.type];

  return (
    <Card className="group relative overflow-hidden shadow-soft hover:shadow-medium transition-all duration-300 animate-fade-in">
      <div className="absolute top-0 right-0 w-32 h-32 gradient-ocean opacity-5 rounded-bl-full" />
      
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', unitColors[unit.type])}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                {getUnitTypeEmoji(unit.type)} {unit.name}
              </h3>
              <Badge variant="secondary" className="mt-1">
                {unit.type}
              </Badge>
            </div>
          </div>
          
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onEdit(unit)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => onDelete(unit.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
