import { describe, it, expect } from 'vitest';
import { parseMatchDateTime, sortMatchesChronologically, formatTimeWithUS } from '../utils/dateUtils';

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

  describe('formatTimeWithUS', () => {
    it('returns empty string if input is falsy', () => {
      expect(formatTimeWithUS('')).toBe('');
      expect(formatTimeWithUS(null as any)).toBe('');
      expect(formatTimeWithUS(undefined as any)).toBe('');
    });

    it('returns input unchanged if it already includes US flag', () => {
      expect(formatTimeWithUS('19:00 | 12:00 🇺🇸')).toBe('19:00 | 12:00 🇺🇸');
      expect(formatTimeWithUS('Some text 🇺🇸')).toBe('Some text 🇺🇸');
    });

    it('returns input unchanged if it does not match time format', () => {
      expect(formatTimeWithUS('No time here')).toBe('No time here');
      expect(formatTimeWithUS('123456')).toBe('123456');
    });

    it('formats normal times correctly (IL to US East Coast, -7 hours)', () => {
      expect(formatTimeWithUS('20:30')).toBe('20:30 | 13:30 🇺🇸');
      expect(formatTimeWithUS('19:00')).toBe('19:00 | 12:00 🇺🇸');
      expect(formatTimeWithUS('15:15')).toBe('15:15 | 08:15 🇺🇸');
      expect(formatTimeWithUS('09:45')).toBe('09:45 | 02:45 🇺🇸');
    });

    it('handles negative hours by wrapping around 24h', () => {
      expect(formatTimeWithUS('05:00')).toBe('05:00 | 22:00 🇺🇸');
      expect(formatTimeWithUS('00:30')).toBe('00:30 | 17:30 🇺🇸');
      expect(formatTimeWithUS('02:15')).toBe('02:15 | 19:15 🇺🇸');
    });

    it('pads hours with zeroes when needed', () => {
      expect(formatTimeWithUS('8:30')).toBe('08:30 | 01:30 🇺🇸');
      expect(formatTimeWithUS('9:00')).toBe('09:00 | 02:00 🇺🇸');
    });
  });
});
