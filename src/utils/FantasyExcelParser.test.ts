import { describe, it, expect } from 'vitest';
import { parseFantasyExcel } from './FantasyExcelParser';

describe('FantasyExcelParser', () => {
  it('should parse a standard CSV correctly', () => {
    const csv = `עמדה,שם שחקן,קבוצה במציאות,קבוצת פנטזי
GK,דניאל פרץ,מכבי תל אביב,הקבוצה שלי
DEF,רז שלמה,מכבי נתניה,הקבוצה שלי
MID,עלי מוחמד,מכבי חיפה,הקבוצה שלי
FWD,ערן זהבי,מכבי תל אביב,הקבוצה שלי`;

    const players = parseFantasyExcel(csv);

    expect(players).toHaveLength(4);

    expect(players[0].name).toBe('דניאל פרץ');
    expect(players[0].position).toBe('GK');
    expect(players[0].team).toBe('מכבי תל אביב');
    expect(players[0].fantasyTeam).toBe('הקבוצה שלי');
    expect(players[0].id).toBeDefined();

    expect(players[3].name).toBe('ערן זהבי');
    expect(players[3].position).toBe('FWD');
  });

  it('should handle commas inside quotes correctly', () => {
    const csv = `עמדה,שם שחקן,קבוצה במציאות,קבוצת פנטזי
"שוער","עומרי גלזר","הפועל ב""ש","קבוצה, בע""מ"`;

    const players = parseFantasyExcel(csv);

    expect(players).toHaveLength(1);
    expect(players[0].name).toBe('עומרי גלזר');
    expect(players[0].team).toBe('הפועל באר שבע'); // Note: 'הפועל ב""ש' gets cleaned to 'הפועל באר שבע'
    expect(players[0].fantasyTeam).toBe('קבוצה, בעמ'); // The parser replaces quotes, so it becomes 'קבוצה, בעמ'
  });

  it('should skip empty slots in the squad', () => {
    const csv = `עמדה,שם שחקן,קבוצה במציאות,קבוצת פנטזי
שוער,דניאל פרץ,מכבי תל אביב,קבוצה
הגנה,מקום פנוי בסגל, , קבוצה`;

    const players = parseFantasyExcel(csv);

    expect(players).toHaveLength(1);
    expect(players[0].name).toBe('דניאל פרץ');
  });

  it('should skip empty rows and invalid rows', () => {
    const csv = `עמדה,שם שחקן,קבוצה במציאות,קבוצת פנטזי

שוער,,מכבי תל אביב,קבוצה
רק שתי עמודות,בלבד
GK,שחקן,קבוצה,פנטזי`;

    const players = parseFantasyExcel(csv);

    expect(players).toHaveLength(1);
    expect(players[0].name).toBe('שחקן');
  });

  it('should map positions correctly', () => {
    const csv = `עמדה,שם שחקן,קבוצה במציאות,קבוצת פנטזי
שוער,שחקן,ק,פ
GK,שחקן,ק,פ
הגנה,שחקן,ק,פ
מגן שמאלי,שחקן,ק,פ
בלם,שחקן,ק,פ
DEF,שחקן,ק,פ
קישור,שחקן,ק,פ
קשר,שחקן,ק,פ
MID,שחקן,ק,פ
התקפה,שחקן,ק,פ
חלוץ,שחקן,ק,פ
FWD,שחקן,ק,פ
לא ידוע,שחקן,ק,פ`;

    const players = parseFantasyExcel(csv);

    expect(players).toHaveLength(13);
    expect(players[0].position).toBe('GK');
    expect(players[1].position).toBe('GK');
    expect(players[2].position).toBe('DEF');
    expect(players[3].position).toBe('DEF');
    expect(players[4].position).toBe('DEF');
    expect(players[5].position).toBe('DEF');
    expect(players[6].position).toBe('MID');
    expect(players[7].position).toBe('MID');
    expect(players[8].position).toBe('MID');
    expect(players[9].position).toBe('FWD');
    expect(players[10].position).toBe('FWD');
    expect(players[11].position).toBe('FWD');
    expect(players[12].position).toBe('DEF'); // fallback
  });

  it('should clean team names correctly', () => {
    // The parser replaces `"` so `הפועל ת"א` becomes `הפועל תא`, which matches the rule for 'הפועל תל אביב'
    const csv = `עמדה,שם שחקן,קבוצה במציאות,קבוצת פנטזי
GK,שחקן,ביתר ירושלים,פ
GK,שחקן,בית״ר,פ
GK,שחקן,הפ חיפה,פ
GK,שחקן,הפ תא,פ
GK,שחקן,הפועל תא,פ
GK,שחקן,מכבי תא,פ
GK,שחקן,מכבי תא,פ
GK,שחקן,בש,פ
GK,שחקן,הפועל בש,פ
GK,שחקן,בש,פ
GK,שחקן,הפועל פת,פ
GK,שחקן,הפועל פת,פ
GK,שחקן,קש,פ
GK,שחקן,קש,פ
GK,שחקן,עירוני קש,פ
GK,שחקן,,פ`;

    const players = parseFantasyExcel(csv);

    expect(players[0].team).toBe('בית"ר ירושלים');
    expect(players[1].team).toBe('בית"ר ירושלים');
    expect(players[2].team).toBe('הפועל חיפה');
    expect(players[3].team).toBe('הפועל תל אביב');
    expect(players[4].team).toBe('הפועל תל אביב');
    expect(players[5].team).toBe('מכבי תל אביב');
    expect(players[6].team).toBe('מכבי תל אביב');
    expect(players[7].team).toBe('הפועל באר שבע');
    expect(players[8].team).toBe('הפועל באר שבע');
    expect(players[9].team).toBe('הפועל באר שבע');
    expect(players[10].team).toBe('הפועל פתח תקווה');
    expect(players[11].team).toBe('הפועל פתח תקווה');
    expect(players[12].team).toBe('עירוני קרית שמונה');
    expect(players[13].team).toBe('עירוני קרית שמונה');
    expect(players[14].team).toBe('עירוני קרית שמונה');
    expect(players[15].team).toBe('לא ידוע'); // empty
  });
});
