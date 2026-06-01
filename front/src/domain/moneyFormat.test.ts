import { describe, expect, it } from 'vitest';
import { formatCompactMoneyNumber, formatMoneyNumber, formatRubles, formatSignedRubles } from './moneyFormat';

describe('moneyFormat contract', () => {
  it('formats ruble amounts consistently for operational screens', () => {
    expect(formatMoneyNumber(123456)).toBe('123 456');
    expect(formatRubles(123456)).toBe('123 456 ₽');
    expect(formatSignedRubles(123456)).toBe('+123 456 ₽');
    expect(formatSignedRubles(-123456)).toBe('-123 456 ₽');
  });

  it('uses compact notation only for larger dashboard values', () => {
    expect(formatCompactMoneyNumber(9500)).toBe('9 500');
    expect(formatCompactMoneyNumber(12500)).toContain('тыс.');
  });
});
