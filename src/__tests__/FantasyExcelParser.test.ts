import { describe, it, expect } from 'vitest';
import { parseFantasyExcel } from '../utils/FantasyExcelParser';

describe('FantasyExcelParser - cleanTeamName tests', () => {
  const createCSV = (teamName: string) => {
    const escapedTeamName = `"${teamName.replace(/"/g, '""')}"`;
    return `עמדה,שם שחקן,קבוצה במציאות,קבוצת פנטזי\nDEF,Test Player,${escapedTeamName},Test Fantasy Team`;
  };

  it('should handle empty or undefined team names', () => {
    const csv = `עמדה,שם שחקן,קבוצה במציאות,קבוצת פנטזי\nDEF,Test Player,,Test Fantasy Team`;
    const players = parseFantasyExcel(csv);
    expect(players[0].team).toBe('לא ידוע');
  });

  it('should clean quotes and single quotes from team names', () => {
    // Tests for stripping ", ', ״, ׳
    expect(parseFantasyExcel(createCSV('"מכבי נתניה"'))[0].team).toBe('מכבי נתניה');
    expect(parseFantasyExcel(createCSV("'מכבי נתניה'"))[0].team).toBe('מכבי נתניה');
    expect(parseFantasyExcel(createCSV('מכבי ״נתניה״'))[0].team).toBe('מכבי נתניה');
    expect(parseFantasyExcel(createCSV('מכבי ׳נתניה׳'))[0].team).toBe('מכבי נתניה');
  });

  describe('Team Name Normalization', () => {
    it('should normalize Beitar Jerusalem', () => {
      const inputs = ['ביתר', 'בית״ר', 'בית"ר', 'ביתר ירושלים'];
      inputs.forEach(input => {
        const players = parseFantasyExcel(createCSV(input));
        expect(players[0].team).toBe('בית"ר ירושלים');
      });
    });

    it('should normalize Hapoel Haifa', () => {
      const players = parseFantasyExcel(createCSV('הפ חיפה'));
      expect(players[0].team).toBe('הפועל חיפה');
    });

    it('should normalize Hapoel Tel Aviv', () => {
      const inputs = ['הפ תא', 'הפועל תא', 'הפועל ת"א'];
      inputs.forEach(input => {
        const players = parseFantasyExcel(createCSV(input));
        expect(players[0].team).toBe('הפועל תל אביב');
      });
    });

    it('should normalize Maccabi Tel Aviv', () => {
      const inputs = ['מכבי תא', 'מכבי ת"א'];
      inputs.forEach(input => {
        const players = parseFantasyExcel(createCSV(input));
        expect(players[0].team).toBe('מכבי תל אביב');
      });
    });

    it('should normalize Hapoel Beer Sheva', () => {
      const inputs = ['בש', 'הפועל בש', 'ב"ש', 'הפועל ב"ש'];
      inputs.forEach(input => {
        const players = parseFantasyExcel(createCSV(input));
        expect(players[0].team).toBe('הפועל באר שבע');
      });
    });

    it('should normalize Hapoel Petah Tikva', () => {
      const inputs = ['הפ פת', 'הפועל פת', 'הפועל פ"ת'];
      inputs.forEach(input => {
        const players = parseFantasyExcel(createCSV(input));
        expect(players[0].team).toBe('הפועל פתח תקווה');
      });
    });

    it('should normalize Ironi Kiryat Shmona', () => {
      const inputs = ['קש', 'ק"ש', 'עירוני קש'];
      inputs.forEach(input => {
        const players = parseFantasyExcel(createCSV(input));
        expect(players[0].team).toBe('עירוני קרית שמונה');
      });
    });

    it('should keep other team names as is (after cleaning)', () => {
      const players = parseFantasyExcel(createCSV('מכבי חיפה'));
      expect(players[0].team).toBe('מכבי חיפה');
    });
  });
});
