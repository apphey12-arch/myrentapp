import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Unit, UnitType } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

export const useUnits = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: units = [], isLoading, error } = useQuery({
    queryKey: ['units'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('units')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Unit[];
    },
  });

  const createUnit = useMutation({
    mutationFn: async ({ name, type }: { name: string; type: UnitType }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('units')
        .insert({ name, type, user_id: user.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      toast({ title: 'Unit created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating unit', description: error.message, variant: 'destructive' });
    },
  });

  const updateUnit = useMutation({
    mutationFn: async ({ id, name, type }: { id: string; name: string; type: UnitType }) => {
      const { data, error } = await supabase
        .from('units')
        .update({ name, type })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      toast({ title: 'Unit updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating unit', description: error.message, variant: 'destructive' });
    },
  });

  const deleteUnit = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('units')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      toast({ title: 'Unit deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error deleting unit', description: error.message, variant: 'destructive' });
    },
  });

  return {
    units,
    isLoading,
    error,
    createUnit,
    updateUnit,
    deleteUnit,
  };
};
