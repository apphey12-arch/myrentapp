import { addDays, format, isAfter, isBefore, isEqual, parseISO } from 'date-fns';

export const calculateEndDate = (startDate: Date, durationDays: number): Date => {
  return addDays(startDate, durationDays - 1);
};

export const calculateTotalAmount = (dailyRate: number, durationDays: number): number => {
  return dailyRate * durationDays;
};

export const formatDateRange = (startDate: string, endDate: string): string => {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${format(start, 'MMM d')} - ${format(end, 'd, yyyy')}`;
  }
  
  if (start.getFullYear() === end.getFullYear()) {
    return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
  }
  
  return `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`;
};

export const checkDateOverlap = (
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date
): boolean => {
  return (
    (isBefore(startA, endB) || isEqual(startA, endB)) &&
    (isAfter(endA, startB) || isEqual(endA, startB))
  );
};

export const formatDisplayDate = (dateString: string): string => {
  return format(parseISO(dateString), 'MMM d, yyyy');
};
