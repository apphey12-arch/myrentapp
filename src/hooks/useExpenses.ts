import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Expense } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

export interface CreateExpenseData {
  unit_id?: string | null;
  description: string;
  amount: number;
  category: string;
  expense_date: string;
  notes?: string;
}

export interface UpdateExpenseData extends Partial<CreateExpenseData> {
  id: string;
}

export const useExpenses = (unitFilter?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: expenses = [], isLoading, error } = useQuery({
    queryKey: ['expenses', unitFilter],
    queryFn: async () => {
      let query = supabase
        .from('expenses')
        .select(`
          *,
          unit:units(*)
        `)
        .order('expense_date', { ascending: false });
      
      if (unitFilter && unitFilter !== 'all') {
        query = query.eq('unit_id', unitFilter);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Expense[];
    },
  });

  const createExpense = useMutation({
    mutationFn: async (data: CreateExpenseData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: expense, error } = await supabase
        .from('expenses')
        .insert({ ...data, user_id: user.id })
        .select(`*, unit:units(*)`)
        .single();
      
      if (error) throw error;
      return expense;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({ title: 'Expense created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating expense', description: error.message, variant: 'destructive' });
    },
  });

  const updateExpense = useMutation({
    mutationFn: async ({ id, ...data }: UpdateExpenseData) => {
      const { data: expense, error } = await supabase
        .from('expenses')
        .update(data)
        .eq('id', id)
        .select(`*, unit:units(*)`)
        .single();
      
      if (error) throw error;
      return expense;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({ title: 'Expense updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating expense', description: error.message, variant: 'destructive' });
    },
  });

  const deleteExpense = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({ title: 'Expense deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error deleting expense', description: error.message, variant: 'destructive' });
    },
  });

  return {
    expenses,
    isLoading,
    error,
    createExpense,
    updateExpense,
    deleteExpense,
  };
};
