export type UnitType = 'Villa' | 'Chalet' | 'Palace';
export type BookingStatus = 'Confirmed' | 'Unconfirmed' | 'Cancelled';
export type TenantRating = 'Welcome Back' | 'Do Not Rent Again';
export type PaymentStatus = 'Paid' | 'Pending' | 'Overdue';

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
  phone_number: string | null;
  start_date: string;
  duration_days: number;
  end_date: string;
  daily_rate: number;
  total_amount: number;
  status: BookingStatus;
  payment_status: PaymentStatus;
  deposit_paid: boolean;
  deposit_amount: number;
  housekeeping_required: boolean;
  housekeeping_amount: number;
  notes: string | null;
  tenant_rating: TenantRating | null;
  created_at: string;
  updated_at: string;
  // Joined data
  unit?: Unit;
}

export interface Expense {
  id: string;
  user_id: string;
  unit_id: string | null;
  description: string;
  amount: number;
  category: string;
  expense_date: string;
  notes: string | null;
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

// Unit type emoji helper
export const getUnitTypeEmoji = (type: UnitType): string => {
  switch (type) {
    case 'Villa':
      return '🏡';
    case 'Palace':
      return '🏰';
    case 'Chalet':
      return '🏖️';
    default:
      return '';
  }
};
