import { describe, it, expect } from 'vitest';
import { parseFantasyExcel } from '../utils/FantasyExcelParser';

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

  it('handles commas inside quoted strings', () => {
    const csvContent = `עמדה,שם שחקן,קבוצה במציאות,קבוצת פנטזי
קשר,יוסי בניון,"ביתר, ירושלים",חמסילי
`;
    const parsed = parseFantasyExcel(csvContent);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].team).toBe('בית"ר ירושלים');
  });

  it('handles double quotes inside quoted strings correctly', () => {
    const csvContent = `עמדה,שם שחקן,קבוצה במציאות,קבוצת פנטזי
קשר,יוסי בניון,"הפועל פ""ת",חמסילי
`;
    const parsed = parseFantasyExcel(csvContent);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].team).toBe('הפועל פתח תקווה');
  });

  it('skips empty lines, invalid rows, and header rows correctly', () => {
    const csvContent = `עמדה,שם שחקן,קבוצה במציאות,קבוצת פנטזי

קשר,יוסי בניון,ביתר,חמסילי
עמדה,שם שחקן,קבוצה במציאות,קבוצת פנטזי
בלם,שחקן חסר קבוצה
`;
    const parsed = parseFantasyExcel(csvContent);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].name).toBe('יוסי בניון');
  });

  it('skips empty slots in the squad', () => {
    const csvContent = `עמדה,שם שחקן,קבוצה במציאות,קבוצת פנטזי
קשר,מקום פנוי בסגל,ביתר,חמסילי
קשר,א,ביתר,חמסילי
קשר,יוסי בניון,ביתר,חמסילי
`;
    const parsed = parseFantasyExcel(csvContent);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].name).toBe('יוסי בניון');
  });

  it('maps positions correctly', () => {
    const csvContent = `עמדה,שם שחקן,קבוצה במציאות,קבוצת פנטזי
שוער,אא,ביתר,חמסילי
GK,בב,ביתר,חמסילי
הגנה,גג,ביתר,חמסילי
בלם,דד,ביתר,חמסילי
מגן,הה,ביתר,חמסילי
DEF,וו,ביתר,חמסילי
קישור,זז,ביתר,חמסילי
קשר,חח,ביתר,חמסילי
MID,טט,ביתר,חמסילי
התקפה,יי,ביתר,חמסילי
חלוץ,יא,ביתר,חמסילי
FWD,יב,ביתר,חמסילי
לאמוגדר,יג,ביתר,חמסילי
`;
    const parsed = parseFantasyExcel(csvContent);
    // אא, בב => GK
    expect(parsed.find(p => p.name === 'אא')?.position).toBe('GK');
    expect(parsed.find(p => p.name === 'בב')?.position).toBe('GK');
    // גג, דד, הה, וו => DEF
    expect(parsed.find(p => p.name === 'גג')?.position).toBe('DEF');
    expect(parsed.find(p => p.name === 'דד')?.position).toBe('DEF');
    expect(parsed.find(p => p.name === 'הה')?.position).toBe('DEF');
    expect(parsed.find(p => p.name === 'וו')?.position).toBe('DEF');
    // זז, חח, טט => MID
    expect(parsed.find(p => p.name === 'זז')?.position).toBe('MID');
    expect(parsed.find(p => p.name === 'חח')?.position).toBe('MID');
    expect(parsed.find(p => p.name === 'טט')?.position).toBe('MID');
    // יי, יא, יב => FWD
    expect(parsed.find(p => p.name === 'יי')?.position).toBe('FWD');
    expect(parsed.find(p => p.name === 'יא')?.position).toBe('FWD');
    expect(parsed.find(p => p.name === 'יב')?.position).toBe('FWD');
    // יג => DEF (default)
    expect(parsed.find(p => p.name === 'יג')?.position).toBe('DEF');
  });

  it('sets expected default properties and generates an id', () => {
    const csvContent = `עמדה,שם שחקן,קבוצה במציאות,קבוצת פנטזי
קשר,יוסי בניון,ביתר,חמסילי
`;
    const parsed = parseFantasyExcel(csvContent);
    expect(parsed).toHaveLength(1);
    const p = parsed[0];
    expect(p.points).toBe(0);
    expect(p.isStarting).toBe(false);
    expect(p.breakdown).toEqual([]);
    expect(p.id).toMatch(/^p_[a-z0-9]{9}_\d+$/);
  });
});
