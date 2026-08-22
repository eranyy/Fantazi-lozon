import { describe, it, expect } from 'vitest';
import { parseMatchDateTime, sortMatchesChronologically } from '../utils/dateUtils';

describe('dateUtils', () => {
  describe('parseMatchDateTime', () => {
    it('returns Infinity for invalid, empty or postponed matches', () => {
      expect(parseMatchDateTime(null)).toBe(Infinity);
      expect(parseMatchDateTime({})).toBe(Infinity);
      expect(parseMatchDateTime({ date: 'נדחה' })).toBe(Infinity);
      expect(parseMatchDateTime({ date: 'טרם נקבע' })).toBe(Infinity);
      expect(parseMatchDateTime({ date: 'ייקבע בהמשך' })).toBe(Infinity);
      expect(parseMatchDateTime({ date: '25/08/2026', status: 'נדחה' })).toBe(Infinity);
    });

    it('returns numeric timestamp if already provided', () => {
      const ts = 1787000000000;
      expect(parseMatchDateTime({ timestamp: ts })).toBe(ts);
    });

    it('parses valid date and time strings correctly', () => {
      const match = { date: '24/08/2026', time: '20:30' };
      const parsed = parseMatchDateTime(match);
      const expected = new Date(2026, 7, 24, 20, 30).getTime();
      expect(parsed).toBe(expected);
    });

    it('handles 2-digit years correctly', () => {
      const match = { date: '24/08/26', time: '19:00' };
      const parsed = parseMatchDateTime(match);
      const expected = new Date(2026, 7, 24, 19, 0).getTime();
      expect(parsed).toBe(expected);
    });
  });

  describe('sortMatchesChronologically', () => {
    it('sorts matches in chronological order', () => {
      const m1 = { date: '25/08/2026', time: '20:00' };
      const m2 = { date: '24/08/2026', time: '19:00' };
      const m3 = { date: 'נדחה' };

      const sorted = sortMatchesChronologically([m1, m3, m2]);
      expect(sorted[0]).toBe(m2);
      expect(sorted[1]).toBe(m1);
      expect(sorted[2]).toBe(m3);
    });

    it('handles non-array inputs gracefully', () => {
      expect(sortMatchesChronologically(null as any)).toEqual([]);
    });
  });
});
