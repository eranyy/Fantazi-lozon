import { describe, it, expect } from 'vitest';
import { cleanTeamName } from '../FantasyExcelParser';

describe('cleanTeamName', () => {
  it('handles empty or undefined values', () => {
    expect(cleanTeamName('')).toBe('לא ידוע');
    expect(cleanTeamName(null as unknown as string)).toBe('לא ידוע');
    expect(cleanTeamName(undefined as unknown as string)).toBe('לא ידוע');
  });

  it('removes quotes and trims whitespace', () => {
    expect(cleanTeamName(' "מכבי נתניה" ')).toBe('מכבי נתניה');
    expect(cleanTeamName('\'מכבי חיפה\'')).toBe('מכבי חיפה');
    expect(cleanTeamName('״מכבי פתח תקווה״')).toBe('מכבי פתח תקווה');
    expect(cleanTeamName('׳אשדוד׳')).toBe('אשדוד');
    expect(cleanTeamName('   בני סכנין   ')).toBe('בני סכנין');
  });

  it('maps Beitar Jerusalem variants correctly', () => {
    expect(cleanTeamName('ביתר ירושלים')).toBe('בית"ר ירושלים');
    expect(cleanTeamName('בית״ר ירושלים')).toBe('בית"ר ירושלים');
    expect(cleanTeamName('בית"ר ירושלים')).toBe('בית"ר ירושלים');
    expect(cleanTeamName('ביתר')).toBe('בית"ר ירושלים');
    expect(cleanTeamName('בית״ר')).toBe('בית"ר ירושלים');
  });

  it('maps Hapoel Haifa correctly', () => {
    expect(cleanTeamName('הפ חיפה')).toBe('הפועל חיפה');
    expect(cleanTeamName('הפועל חיפה')).toBe('הפועל חיפה');
  });

  it('maps Hapoel Tel Aviv variants correctly', () => {
    expect(cleanTeamName('הפ תא')).toBe('הפועל תל אביב');
    expect(cleanTeamName('הפועל תא')).toBe('הפועל תל אביב');
    expect(cleanTeamName('הפועל ת"א')).toBe('הפועל תל אביב');
  });

  it('maps Maccabi Tel Aviv variants correctly', () => {
    expect(cleanTeamName('מכבי תא')).toBe('מכבי תל אביב');
    expect(cleanTeamName('מכבי ת"א')).toBe('מכבי תל אביב');
  });

  it('maps Hapoel Beer Sheva variants correctly', () => {
    expect(cleanTeamName('בש')).toBe('הפועל באר שבע');
    expect(cleanTeamName('הפועל בש')).toBe('הפועל באר שבע');
    expect(cleanTeamName('ב"ש')).toBe('הפועל באר שבע');
    expect(cleanTeamName('הפועל ב"ש')).toBe('הפועל באר שבע');
  });

  it('maps Hapoel Petah Tikva variants correctly', () => {
    expect(cleanTeamName('הפ פת')).toBe('הפועל פתח תקווה');
    expect(cleanTeamName('הפועל פת')).toBe('הפועל פתח תקווה');
    expect(cleanTeamName('הפועל פ"ת')).toBe('הפועל פתח תקווה');
  });

  it('maps Ironi Kiryat Shmona variants correctly', () => {
    expect(cleanTeamName('קש')).toBe('עירוני קרית שמונה');
    expect(cleanTeamName('ק"ש')).toBe('עירוני קרית שמונה');
    expect(cleanTeamName('עירוני קש')).toBe('עירוני קרית שמונה');
    expect(cleanTeamName('עירוני ק"ש')).toBe('עירוני קרית שמונה');
  });

  it('returns cleaned name if no specific mapping matches', () => {
    expect(cleanTeamName('מכבי נתניה')).toBe('מכבי נתניה');
    expect(cleanTeamName('מ.ס אשדוד')).toBe('מ.ס אשדוד');
    expect(cleanTeamName('הפועל ירושלים')).toBe('הפועל ירושלים');
  });
});
