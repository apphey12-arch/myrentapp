export type UnitType = 'Villa' | 'Chalet' | 'Palace';
export type BookingStatus = 'Confirmed' | 'Unconfirmed' | 'Cancelled';
export type TenantRating = 'Welcome Back' | 'Do Not Rent Again';

export interface Unit {
  id: string;
  user_id: string;
  name: string;
  type: UnitType;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  unit_id: string;
  user_id: string;
  tenant_name: string;
  start_date: string;
  duration_days: number;
  end_date: string;
  daily_rate: number;
  total_amount: number;
  status: BookingStatus;
  deposit_paid: boolean;
  housekeeping_required: boolean;
  notes: string | null;
  tenant_rating: TenantRating | null;
  created_at: string;
  updated_at: string;
  // Joined data
  unit?: Unit;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  created_at: string;
  updated_at: string;
}
