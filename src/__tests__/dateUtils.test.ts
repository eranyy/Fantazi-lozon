import { describe, it, expect } from 'vitest';
import { parseMatchDateTime, sortMatchesChronologically, formatMatchDateDisplay, formatMatchTime, formatTimeWithUS } from '../utils/dateUtils';

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

  describe('formatMatchTime', () => {
    it('returns default 20:00 for missing or empty input', () => {
      expect(formatMatchTime(undefined)).toBe('20:00');
      expect(formatMatchTime('')).toBe('20:00');
    });

    it('formats time strings with padding correctly', () => {
      expect(formatMatchTime('8:30')).toBe('08:30');
      expect(formatMatchTime('20:15')).toBe('20:15');
      expect(formatMatchTime('9:5')).toBe('09:05');
      expect(formatMatchTime('19:00:00')).toBe('19:00');
    });

    it('returns original string if format is unparseable', () => {
      expect(formatMatchTime('TBD')).toBe('TBD');
    });
  });

  describe('formatMatchDateDisplay', () => {
    it('returns empty string for missing input', () => {
      expect(formatMatchDateDisplay(undefined)).toBe('');
      expect(formatMatchDateDisplay('')).toBe('');
    });

    it('preserves postponed or unassigned date markers', () => {
      expect(formatMatchDateDisplay('נדחה')).toBe('נדחה');
      expect(formatMatchDateDisplay('טרם נקבע')).toBe('טרם נקבע');
    });

    it('formats ISO and DMY dates correctly', () => {
      expect(formatMatchDateDisplay('2026-08-24')).toBe('24/08/2026');
      expect(formatMatchDateDisplay('4/8/2026')).toBe('04/08/2026');
      expect(formatMatchDateDisplay('24/8')).toBe('24/08/2026');
    });
  });

  describe('formatTimeWithUS', () => {
    it('returns empty string for missing or empty input', () => {
      expect(formatTimeWithUS('')).toBe('');
      expect(formatTimeWithUS(null as any)).toBe('');
      expect(formatTimeWithUS(undefined as any)).toBe('');
    });

    it('returns string unchanged if US flag emoji is already present', () => {
      expect(formatTimeWithUS('20:30 | 13:30 🇺🇸')).toBe('20:30 | 13:30 🇺🇸');
    });

    it('returns original input if time pattern HH:MM is not found', () => {
      expect(formatTimeWithUS('TBD')).toBe('TBD');
      expect(formatTimeWithUS('טרם נקבע')).toBe('טרם נקבע');
    });

    it('converts Israel time to US timezone (subtracting 7 hours)', () => {
      expect(formatTimeWithUS('20:00')).toBe('20:00 | 13:00 🇺🇸');
      expect(formatTimeWithUS('21:15')).toBe('21:15 | 14:15 🇺🇸');
    });

    it('handles midnight wrap-around correctly when subtracting 7 hours', () => {
      expect(formatTimeWithUS('03:00')).toBe('03:00 | 20:00 🇺🇸');
      expect(formatTimeWithUS('06:45')).toBe('06:45 | 23:45 🇺🇸');
      expect(formatTimeWithUS('00:00')).toBe('00:00 | 17:00 🇺🇸');
    });
  });
});


