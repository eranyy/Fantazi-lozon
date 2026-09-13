import { parseCsvRow } from './csvUtils';

export { parseCsvRow };

export interface ParsedPlayer {
  id: string;
  name: string;
  position: string;
  team: string;
  fantasyTeam: string;
  points: number;
  isStarting: boolean;
  breakdown: any[];
}

const TEAM_ALIAS_MAP: Record<string, string> = {
  'הפ חיפה': 'הפועל חיפה',
  'הפ תא': 'הפועל תל אביב',
  'הפועל תא': 'הפועל תל אביב',
  'הפועל ת"א': 'הפועל תל אביב',
  'מכבי תא': 'מכבי תל אביב',
  'מכבי ת"א': 'מכבי תל אביב',
  'בש': 'הפועל באר שבע',
  'הפועל בש': 'הפועל באר שבע',
  'ב"ש': 'הפועל באר שבע',
  'הפועל ב"ש': 'הפועל באר שבע',
  'הפ פת': 'הפועל פתח תקווה',
  'הפועל פת': 'הפועל פתח תקווה',
  'הפועל פ"ת': 'הפועל פתח תקווה',
  'קש': 'עירוני קרית שמונה',
  'ק"ש': 'עירוני קרית שמונה',
  'עירוני קש': 'עירוני קרית שמונה',
};

const cleanTeamName = (teamName: string): string => {
  if (!teamName) return 'לא ידוע';
  const cleaned = teamName.replace(/["'״׳]/g, '').trim();
  if (TEAM_ALIAS_MAP[cleaned]) return TEAM_ALIAS_MAP[cleaned];
  
  if (cleaned.includes('ביתר') || cleaned.includes('בית״ר') || cleaned.includes('בית"ר')) return 'בית"ר ירושלים';
  return cleaned;
};

const mapPosition = (pos: string): string => {
  if (!pos) return 'DEF';
  const p = pos.trim().toUpperCase();
  if (p.includes('שוער') || p === 'GK') return 'GK';
  if (p.includes('הגנה') || p.includes('בלם') || p.includes('מגן') || p === 'DEF') return 'DEF';
  if (p.includes('קישור') || p.includes('קשר') || p === 'MID') return 'MID';
  if (p.includes('התקפה') || p.includes('חלוץ') || p === 'FWD') return 'FWD';
  return 'DEF';
};

/**
 * Parses the simple flat CSV structure:
 * עמדה | שם שחקן | קבוצה במציאות | קבוצת פנטזי
 */
export const parseFantasyExcel = (csvText: string): ParsedPlayer[] => {
  // Split into lines
  const lines = csvText.replace(/\r/g, '').split('\n');
  const players: ParsedPlayer[] = [];

  // Start from index 1 to skip the header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const row = parseCsvRow(line);

    // Basic validation: row must have at least 4 columns, and it shouldn't be the header
    if (row.length < 4 || row[0] === 'עמדה' || !row[1]) continue;

    const posStr = row[0];
    const playerName = row[1];
    const realTeam = row[2];
    const fantasyTeamName = row[3];

    // Skip empty slots in the squad
    if (playerName && !playerName.includes('מקום פנוי בסגל') && playerName.length > 1) {
      const playerId = `p_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
      
      players.push({
        id: playerId,
        name: playerName,
        position: mapPosition(posStr),
        team: cleanTeamName(realTeam),
        fantasyTeam: fantasyTeamName,
        points: 0,
        isStarting: false,
        breakdown: []
      });
    }
  }

  console.log(`[FantasyExcelParser] Successfully parsed ${players.length} players from CSV.`);
  return players;
};