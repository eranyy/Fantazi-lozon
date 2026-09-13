import { describe, it, expect } from 'vitest';
import { getTeamColors, cleanStr, getHistoricalName, normalizeTeamName } from '../utils/teamUtils';

describe('teamUtils', () => {
  describe('getTeamColors', () => {
    it('returns goalkeeper colors when isGK is true regardless of team name', () => {
      const gkColors = getTeamColors('טמפה', true);
      expect(gkColors).toEqual({ prim: '#bef264', sec: '#4d7c0f', text: '#14532d' });
    });

    it('returns correct colors for Tampa', () => {
      const colors = getTeamColors('מואדון טמפה', false);
      expect(colors).toEqual({ prim: '#ef4444', sec: '#991b1b', text: '#ffffff' });
    });

    it('returns correct colors for Tumali and Pichichi', () => {
      expect(getTeamColors('תומאלי', false)).toEqual({ prim: '#facc15', sec: '#1d4ed8', text: '#ffffff' });
      expect(getTeamColors("פיצ'יצ'י", false)).toEqual({ prim: '#facc15', sec: '#1d4ed8', text: '#ffffff' });
      expect(getTeamColors('פציצי', false)).toEqual({ prim: '#facc15', sec: '#1d4ed8', text: '#ffffff' });
    });

    it('returns correct colors for Hamsili', () => {
      const colors = getTeamColors('חמסילי', false);
      expect(colors).toEqual({ prim: '#18181b', sec: '#16a34a', text: '#facc15' });
    });

    it('returns correct colors for Holonia', () => {
      const colors = getTeamColors('חולוניה', false);
      expect(colors).toEqual({ prim: '#a855f7', sec: '#4c1d95', text: '#ffffff' });
    });

    it('returns correct colors for Harale', () => {
      const colors = getTeamColors('חראלה', false);
      expect(colors).toEqual({ prim: '#78350f', sec: '#b91c1c', text: '#ffffff' });
    });

    it('returns default fallback colors for unknown teams or empty string', () => {
      expect(getTeamColors('', false)).toEqual({ prim: '#3b82f6', sec: '#1e3a8a', text: '#ffffff' });
      expect(getTeamColors('קבוצה אלמונית', false)).toEqual({ prim: '#3b82f6', sec: '#1e3a8a', text: '#ffffff' });
    });
  });

  describe('cleanStr', () => {
    it('cleans quotes, spaces, dashes and brackets', () => {
      expect(cleanStr('  "פיצ\'יצ\'י" (FC)-  ')).toBe('פיציציfc');
      expect(cleanStr(null)).toBe('');
    });
  });

  describe('normalizeTeamName', () => {
    it.each([
      ['', ''],
      ['  מכבי תל אביב  ', 'מכבי תא'],
      ['הפועל באר שבע', 'הפועל בש'],
      ['עירוני קרית שמונה', 'עירוני קש'],
      ['מכבי פתח תקוה', 'מכבי פת'],
      ['הפועל פתח תקווה', 'הפועל פת'],
      ['ריינה', 'מכבי בני ריינה'],
      ['בני ריינה', 'מכבי בני ריינה'],
      ['מ.ס. אשדוד', 'מס אשדוד'],
      ['עירוני טבריה', 'עירוני טבריה'],
      ['בני סכנין', 'בני סכנין'],
      ['מכבי נתניה', 'מכבי נתניה'],
      ['הפועל חדרה', 'הפועל חדרה'],
      ['  ביתר   ירושלים  ', 'ביתר ירושלים']
    ])('normalizes %s to %s', (input, expected) => {
      expect(normalizeTeamName(input)).toBe(expected);
    });
  });
});
