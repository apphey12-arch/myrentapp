// Currency formatting utilities for Egyptian Pounds (EGP)

export const formatEGP = (amount: number): string => {
  return new Intl.NumberFormat('en-EG', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount) + ' EGP';
};

export const formatEGPCompact = (amount: number): string => {
  if (amount >= 1000000) {
    return (amount / 1000000).toFixed(1) + 'M EGP';
  }
  if (amount >= 1000) {
    return (amount / 1000).toFixed(1) + 'K EGP';
  }
  return formatEGP(amount);
};

export const parseEGP = (value: string): number => {
  const cleaned = value.replace(/[^0-9.]/g, '');
  return parseFloat(cleaned) || 0;
};
