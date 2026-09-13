import { describe, it, expect } from 'vitest';
import { parseCsvRow } from '../utils/csvUtils';

describe('parseCsvRow', () => {
  it('returns empty array for empty or null string', () => {
    expect(parseCsvRow('')).toEqual([]);
    expect(parseCsvRow(null as any)).toEqual([]);
  });

  it('parses unquoted comma-separated values', () => {
    expect(parseCsvRow('DEF, ערן זהבי, מכבי תל אביב, טמפה')).toEqual([
      'DEF',
      'ערן זהבי',
      'מכבי תל אביב',
      'טמפה'
    ]);
  });

  it('handles quoted values with commas correctly', () => {
    expect(parseCsvRow('DEF, "הפועל, פתח תקווה", הפועל פתח תקווה, חראלה')).toEqual([
      'DEF',
      'הפועל, פתח תקווה',
      'הפועל פתח תקווה',
      'חראלה'
    ]);
  });

  it('strips leading and trailing quotes from cells', () => {
    expect(parseCsvRow('"FWD", "דין דוד", "מכבי חיפה", "תומאלי"')).toEqual([
      'FWD',
      'דין דוד',
      'מכבי חיפה',
      'תומאלי'
    ]);
  });
});
