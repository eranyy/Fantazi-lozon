import { describe, it, expect } from 'vitest';
import { getHistoricalName } from '../AdminLeagueManager';

describe('getHistoricalName', () => {
    it('should return empty string for empty input', () => {
        expect(getHistoricalName('')).toBe('');
    });

    it('should match known historical names even with extra whitespace or different cases', () => {
        expect(getHistoricalName('  חמסילי  ')).toBe('חמסילי');
        expect(getHistoricalName('חמסה שלי')).toBe('חמסה');
        expect(getHistoricalName('קבוצת חראלה')).toBe('חראלה');
        expect(getHistoricalName('טמפה ביי')).toBe('טמפה');
        expect(getHistoricalName('תומאלי יונייטד')).toBe('תומאלי');
        expect(getHistoricalName('הפועל חולוניה')).toBe('חולוניה');
    });

    it('should match variations of פיצ\'יצ\'י', () => {
        expect(getHistoricalName('פיציצי')).toBe('פיצ\'יצ\'י');
        expect(getHistoricalName('פציצי')).toBe('פיצ\'יצ\'י');
        expect(getHistoricalName('פיצ\'יצ\'י')).toBe('פיצ\'יצ\'י');
    });

    it('should return original name if no historical match is found', () => {
        expect(getHistoricalName('מכבי תל אביב')).toBe('מכבי תל אביב');
        expect(getHistoricalName('הפועל באר שבע')).toBe('הפועל באר שבע');
    });

    it('should handle special characters correctly', () => {
        expect(getHistoricalName('טמפה-ביי')).toBe('טמפה');
        expect(getHistoricalName('קבוצת "חראלה"')).toBe('חראלה');
        expect(getHistoricalName('חמסה(א)')).toBe('חמסה');
        expect(getHistoricalName('תומאלי`')).toBe('תומאלי');
    });

    it('should match correctly when multiple names are present, returning the first one checked', () => {
        expect(getHistoricalName('חמסילי וחמסה')).toBe('חמסילי');
    });

    it('should return empty string for null or undefined input', () => {
        // @ts-ignore - testing runtime behavior
        expect(getHistoricalName(null)).toBe('');
        // @ts-ignore - testing runtime behavior
        expect(getHistoricalName(undefined)).toBe('');
    });
});
