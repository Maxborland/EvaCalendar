export const formatMoneyNumber = (value: number) =>
  new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 0,
  }).format(value).replace(/\u00a0/g, ' ');

export const formatCompactMoneyNumber = (value: number) =>
  new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 0,
    notation: Math.abs(value) >= 10000 ? 'compact' : 'standard',
  }).format(value).replace(/\u00a0/g, ' ');

export const formatRubles = (value: number) => `${formatMoneyNumber(value)} ₽`;

export const formatSignedRubles = (value: number) => {
  const sign = value >= 0 ? '+' : '-';
  return `${sign}${formatRubles(Math.abs(value))}`;
};
