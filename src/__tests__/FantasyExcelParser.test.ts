import { describe, it, expect } from 'vitest';
import { parseFantasyExcel, mapPosition } from '../utils/FantasyExcelParser';

describe('FantasyExcelParser', () => {
  describe('mapPosition', () => {
    it('maps goalkeeper positions correctly', () => {
      expect(mapPosition('GK')).toBe('GK');
      expect(mapPosition('שוער')).toBe('GK');
      expect(mapPosition(' שוער ')).toBe('GK');
    });

    it('maps defender positions correctly', () => {
      expect(mapPosition('DEF')).toBe('DEF');
      expect(mapPosition('הגנה')).toBe('DEF');
      expect(mapPosition('בלם')).toBe('DEF');
      expect(mapPosition('מגן')).toBe('DEF');
    });

    it('maps midfielder positions correctly', () => {
      expect(mapPosition('MID')).toBe('MID');
      expect(mapPosition('קשר')).toBe('MID');
      expect(mapPosition('קישור')).toBe('MID');
    });

    it('maps forward positions correctly', () => {
      expect(mapPosition('FWD')).toBe('FWD');
      expect(mapPosition('חלוץ')).toBe('FWD');
      expect(mapPosition('התקפה')).toBe('FWD');
    });

    it('maps dual-role (midfielder-forward / קשר - חלוץ) positions correctly', () => {
      expect(mapPosition('קשר - חלוץ')).toBe('MID');
      expect(mapPosition('קשר/חלוץ')).toBe('MID');
      expect(mapPosition('MID/FWD')).toBe('MID');
    });

    it('defaults to DEF for empty, null or unrecognized position strings', () => {
      expect(mapPosition('')).toBe('DEF');
      expect(mapPosition(null as any)).toBe('DEF');
      expect(mapPosition('UNKNOWN')).toBe('DEF');
    });
  });

  it('normalizes various team names correctly', () => {
    const csvContent = `עמדה,שם שחקן,קבוצה במציאות,קבוצת פנטזי
חלוץ,ערן זהבי,ביתר,חמסילי
קשר,עומר אצילי,הפ חיפה,טמפה
בלם,איתן טיבי,בש,חראלה
שוער,רועי משפתי,הפ תא,תומאלי
חלוץ,דין דוד,קש,חולוניה
`;

    const parsed = parseFantasyExcel(csvContent);
    expect(parsed).toHaveLength(5);
    expect(parsed[0].team).toBe('בית"ר ירושלים');
    expect(parsed[1].team).toBe('הפועל חיפה');
    expect(parsed[2].team).toBe('הפועל באר שבע');
    expect(parsed[3].team).toBe('הפועל תל אביב');
    expect(parsed[4].team).toBe('עירוני קרית שמונה');
  });

  it('handles empty or missing team names gracefully', () => {
    const csvContent = `עמדה,שם שחקן,קבוצה במציאות,קבוצת פנטזי
חלוץ,שחקן אלמוני,,חמסילי
`;

    const parsed = parseFantasyExcel(csvContent);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].team).toBe('לא ידוע');
  });

  it('maps positions correctly and handles quoted strings with quotes', () => {
    const csvContent = `עמדה,שם שחקן,קבוצה במציאות,קבוצת פנטזי
שוער,דניאל טננבאום,מכבי תא,חמסילי
"הגנה","שריף כיוף","הפועל פ""ת","טמפה"
קישור,גבי קניקובסקי,מכבי תא,חראלה
חלוץ,ערן זהבי,מכבי תא,חמסילי
`;

    const parsed = parseFantasyExcel(csvContent);
    expect(parsed).toHaveLength(4);
    expect(parsed[0].position).toBe('GK');
    expect(parsed[1].position).toBe('DEF');
    expect(parsed[2].position).toBe('MID');
    expect(parsed[3].position).toBe('FWD');
  });

  it('skips empty squad filler slots like מקום פנוי בסגל', () => {
    const csvContent = `עמדה,שם שחקן,קבוצה במציאות,קבוצת פנטזי
חלוץ,ערן זהבי,מכבי תא,חמסילי
חלוץ,מקום פנוי בסגל,מכבי תא,חמסילי
`;

    const parsed = parseFantasyExcel(csvContent);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].name).toBe('ערן זהבי');
  });
});
