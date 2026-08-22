import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseMatchDateTime, sortMatchesChronologically } from '../utils/dateUtils';

describe('dateUtils', () => {
  beforeEach(() => {
    // Mock current date to a fixed year for testing year fallback
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-05-15T10:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('parseMatchDateTime', () => {
    it('returns Infinity for falsy or missing input', () => {
      expect(parseMatchDateTime(null)).toBe(Infinity);
      expect(parseMatchDateTime(undefined)).toBe(Infinity);
      expect(parseMatchDateTime({})).toBe(Infinity);
    });

    it('returns timestamp if valid number > 0 is provided', () => {
      expect(parseMatchDateTime({ timestamp: 123456789 })).toBe(123456789);
      expect(parseMatchDateTime({ timestamp: 0 })).toBe(Infinity);
      expect(parseMatchDateTime({ timestamp: -1 })).toBe(Infinity);
    });

    it('returns Infinity for matches that are postponed, undetermined, or missing dates', () => {
      expect(parseMatchDateTime({ date: 'נדחה' })).toBe(Infinity);
      expect(parseMatchDateTime({ date: 'טרם נקבע' })).toBe(Infinity);
      expect(parseMatchDateTime({ date: 'מועד ייקבע' })).toBe(Infinity);
      expect(parseMatchDateTime({ date: '01/01', status: 'נדחה' })).toBe(Infinity);
      expect(parseMatchDateTime({ date: ' ' })).toBe(Infinity);
    });

    it('parses DD/MM format with fallback to current year and 19:00 time', () => {
      // 15/05 in 2024 with 19:00 local time
      const expectedDate = new Date(2024, 4, 15, 19, 0).getTime();
      expect(parseMatchDateTime({ date: '15/05' })).toBe(expectedDate);
      expect(parseMatchDateTime({ date: '15.05' })).toBe(expectedDate);
    });

    it('parses DD/MM/YY format (2-digit year < 100 adds 2000)', () => {
      const expectedDate = new Date(2025, 4, 15, 19, 0).getTime();
      expect(parseMatchDateTime({ date: '15/05/25' })).toBe(expectedDate);
    });

    it('parses DD/MM/YYYY format', () => {
      const expectedDate = new Date(2026, 4, 15, 19, 0).getTime();
      expect(parseMatchDateTime({ date: '15/05/2026' })).toBe(expectedDate);
    });

    it('parses explicit time in HH:MM format', () => {
      const expectedDate = new Date(2024, 4, 15, 20, 30).getTime();
      expect(parseMatchDateTime({ date: '15/05', time: '20:30' })).toBe(expectedDate);
    });

    it('handles malformed date format by returning Infinity', () => {
      expect(parseMatchDateTime({ date: 'invalid date' })).toBe(Infinity);
    });
  });

  describe('sortMatchesChronologically', () => {
    it('returns empty array if input is not an array', () => {
      expect(sortMatchesChronologically(null as any)).toEqual([]);
      expect(sortMatchesChronologically(undefined as any)).toEqual([]);
    });

    it('sorts matches based on their parsed datetime', () => {
      const match1 = { date: '15/05', time: '20:00' }; // Later time
      const match2 = { date: '15/05', time: '18:00' }; // Earlier time
      const match3 = { date: '16/05' }; // Later date
      const match4 = { date: 'נדחה' }; // Infinity

      const matches = [match1, match4, match3, match2];
      const sorted = sortMatchesChronologically(matches);

      expect(sorted).toEqual([match2, match1, match3, match4]);
      // Verify original array is unchanged
      expect(matches[0]).toBe(match1);
    });
  });
});
