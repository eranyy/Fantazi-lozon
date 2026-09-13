import { describe, it, expect } from 'vitest';
import { parseCsvRow } from '../utils/csvParser';

describe('parseCsvRow', () => {
    it('returns empty array when passed empty string', () => {
        expect(parseCsvRow('')).toEqual([]);
    });

    it('returns empty array when passed non-string', () => {
        // @ts-expect-error testing invalid input
        expect(parseCsvRow(null)).toEqual([]);
        // @ts-expect-error testing invalid input
        expect(parseCsvRow(undefined)).toEqual([]);
        // @ts-expect-error testing invalid input
        expect(parseCsvRow(123)).toEqual([]);
    });

    it('parses basic comma-separated values correctly', () => {
        const input = 'value1,value2,value3';
        expect(parseCsvRow(input)).toEqual(['value1', 'value2', 'value3']);
    });

    it('handles spaces around values correctly', () => {
        const input = ' value1 , value2 , value3 ';
        expect(parseCsvRow(input)).toEqual(['value1', 'value2', 'value3']);
    });

    it('handles values wrapped in quotes', () => {
        const input = '"value1","value2","value3"';
        expect(parseCsvRow(input)).toEqual(['value1', 'value2', 'value3']);
    });

    it('ignores commas inside quotes', () => {
        const input = 'value1,"value,with,commas",value3';
        expect(parseCsvRow(input)).toEqual(['value1', 'value,with,commas', 'value3']);
    });

    it('handles empty columns correctly', () => {
        const input = 'value1,,value3';
        expect(parseCsvRow(input)).toEqual(['value1', '', 'value3']);
    });

    it('handles multiple empty columns correctly', () => {
        const input = ',,';
        expect(parseCsvRow(input)).toEqual(['', '', '']);
    });

    it('handles quotes with spaces inside by trimming according to current implementation', () => {
        const input = 'value1," value with spaces ",value3';
        expect(parseCsvRow(input)).toEqual(['value1', 'value with spaces', 'value3']);
    });

    it('handles embedded quotes by removing them (as per current implementation)', () => {
        // The current implementation strips all quotes because of inQuotes toggle,
        // it doesn't preserve embedded quotes like 'val""ue2'.
        // This test locks in current behavior without modifying it as per task description
        // ("Untested parseCsvRow utility", "Simple pure string manipulation").
        const input = '"value1","val""ue2","value3"';
        expect(parseCsvRow(input)).toEqual(['value1', 'value2', 'value3']);
    });

    it('handles quotes at edges mixed with spaces correctly', () => {
         // The current implementation first trims and then replaces quotes
         // '"value"' -> 'value'
         const input = ' "value1" , "value2" ';
         expect(parseCsvRow(input)).toEqual(['value1', 'value2']);
    });
});
