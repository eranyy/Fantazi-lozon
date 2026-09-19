import { describe, it, expect } from 'vitest';
import { parseFantasyExcel, cleanTeamName } from '../utils/FantasyExcelParser';

describe('FantasyExcelParser', () => {
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

describe('cleanTeamName', () => {
  it('returns "לא ידוע" for falsy or empty strings', () => {
    expect(cleanTeamName('')).toBe('לא ידוע');
    expect(cleanTeamName(null as unknown as string)).toBe('לא ידוע');
    expect(cleanTeamName(undefined as unknown as string)).toBe('לא ידוע');
  });

  it('removes quotes, apostrophes, and trims whitespace', () => {
    expect(cleanTeamName('  "קבוצה"  ')).toBe('קבוצה');
    expect(cleanTeamName("'קבוצה'")).toBe('קבוצה');
    expect(cleanTeamName('קבו״צה')).toBe('קבוצה');
    expect(cleanTeamName('קבו׳צה')).toBe('קבוצה');
  });

  it('resolves team aliases correctly', () => {
    expect(cleanTeamName('הפ חיפה')).toBe('הפועל חיפה');
    expect(cleanTeamName('מכבי ת"א')).toBe('מכבי תל אביב');
    expect(cleanTeamName('ב"ש')).toBe('הפועל באר שבע');
    expect(cleanTeamName('קש')).toBe('עירוני קרית שמונה');
  });

  it('handles "ביתר" variants and returns "בית"ר ירושלים"', () => {
    expect(cleanTeamName('ביתר')).toBe('בית"ר ירושלים');
    expect(cleanTeamName('בית״ר')).toBe('בית"ר ירושלים');
    expect(cleanTeamName('בית"ר')).toBe('בית"ר ירושלים');
    expect(cleanTeamName('משהו עם ביתר בתוכו')).toBe('בית"ר ירושלים');
  });

  it('returns the cleaned string if no alias or special match is found', () => {
    expect(cleanTeamName('  מכבי חיפה  ')).toBe('מכבי חיפה');
    expect(cleanTeamName('מ.ס אשדוד')).toBe('מ.ס אשדוד');
  });
});
