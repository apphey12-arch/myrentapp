import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Booking, BookingStatus, TenantRating } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { checkDateOverlap } from '@/lib/date-utils';
import { parseISO } from 'date-fns';

export interface CreateBookingData {
  unit_id: string;
  tenant_name: string;
  start_date: string;
  duration_days: number;
  end_date: string;
  daily_rate: number;
  total_amount: number;
  status: BookingStatus;
  deposit_paid?: boolean;
  housekeeping_required?: boolean;
  notes?: string;
}

export interface UpdateBookingData extends Partial<CreateBookingData> {
  id: string;
  tenant_rating?: TenantRating | null;
}

export const useBookings = (unitFilter?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: bookings = [], isLoading, error } = useQuery({
    queryKey: ['bookings', unitFilter],
    queryFn: async () => {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          unit:units(*)
        `)
        .order('start_date', { ascending: false });
      
      if (unitFilter && unitFilter !== 'all') {
        query = query.eq('unit_id', unitFilter);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Booking[];
    },
  });

  const checkConflict = async (
    unitId: string,
    startDate: string,
    endDate: string,
    excludeBookingId?: string
  ): Promise<boolean> => {
    const { data, error } = await supabase
      .from('bookings')
      .select('id, start_date, end_date, status')
      .eq('unit_id', unitId)
      .neq('status', 'Cancelled');
    
    if (error) throw error;

    const conflicting = data.filter(booking => {
      if (excludeBookingId && booking.id === excludeBookingId) return false;
      
      return checkDateOverlap(
        parseISO(startDate),
        parseISO(endDate),
        parseISO(booking.start_date),
        parseISO(booking.end_date)
      );
    });

    return conflicting.length > 0;
  };

  const createBooking = useMutation({
    mutationFn: async (data: CreateBookingData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const hasConflict = await checkConflict(data.unit_id, data.start_date, data.end_date);
      if (hasConflict) {
        throw new Error('This unit already has a booking for the selected dates');
      }

      const { data: booking, error } = await supabase
        .from('bookings')
        .insert({ ...data, user_id: user.id })
        .select(`*, unit:units(*)`)
        .single();
      
      if (error) throw error;
      return booking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast({ title: 'Booking created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating booking', description: error.message, variant: 'destructive' });
    },
  });

  const updateBooking = useMutation({
    mutationFn: async ({ id, ...data }: UpdateBookingData) => {
      if (data.unit_id && data.start_date && data.end_date) {
        const hasConflict = await checkConflict(data.unit_id, data.start_date, data.end_date, id);
        if (hasConflict) {
          throw new Error('This unit already has a booking for the selected dates');
        }
      }

      const { data: booking, error } = await supabase
        .from('bookings')
        .update(data)
        .eq('id', id)
        .select(`*, unit:units(*)`)
        .single();
      
      if (error) throw error;
      return booking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast({ title: 'Booking updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating booking', description: error.message, variant: 'destructive' });
    },
  });

  const deleteBooking = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast({ title: 'Booking deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error deleting booking', description: error.message, variant: 'destructive' });
    },
  });

  return {
    bookings,
    isLoading,
    error,
    createBooking,
    updateBooking,
    deleteBooking,
    checkConflict,
  };
};
