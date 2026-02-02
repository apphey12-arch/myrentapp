import { Unit } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatEGP } from '@/lib/currency';
import { useLanguage } from '@/contexts/LanguageContext';
import { TrendingUp, TrendingDown, DollarSign, Receipt, PiggyBank } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UnitProfitabilityCardProps {
  unit: Unit;
  revenue: number;
  expenses: number;
}

export const UnitProfitabilityCard = ({
  unit,
  revenue,
  expenses,
}: UnitProfitabilityCardProps) => {
  const { t } = useLanguage();
  const netProfit = revenue - expenses;
  const isProfit = netProfit >= 0;

  return (
    <Card className="shadow-soft">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Financial Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Revenue */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10">
              <DollarSign className="h-4 w-4 text-success" />
            </div>
            <span className="text-sm text-muted-foreground">{t('totalRevenue')}</span>
          </div>
          <span className="font-semibold text-success">{formatEGP(revenue)}</span>
        </div>

        {/* Expenses */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10">
              <Receipt className="h-4 w-4 text-destructive" />
            </div>
            <span className="text-sm text-muted-foreground">{t('totalExpenses')}</span>
          </div>
          <span className="font-semibold text-destructive">{formatEGP(expenses)}</span>
        </div>

        {/* Net Profit */}
        <div className="border-t pt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg",
                isProfit ? "bg-success/10" : "bg-destructive/10"
              )}>
                {isProfit ? (
                  <TrendingUp className="h-4 w-4 text-success" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-destructive" />
                )}
              </div>
              <span className="font-medium">Net Profit</span>
            </div>
            <span className={cn(
              "font-bold text-lg",
              isProfit ? "text-success" : "text-destructive"
            )}>
              {isProfit ? '+' : ''}{formatEGP(netProfit)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
