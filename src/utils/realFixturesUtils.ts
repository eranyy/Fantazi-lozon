import { db } from '../firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { sortMatchesChronologically, formatMatchDateDisplay } from './dateUtils';

const SPREADSHEET_ID = '14kSevz6bRm_4xX1jGxGztB0ZDVm8po01tXujvZBgf-s';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&gid=0`;

const parseCsvLine = (line: string): string[] => {
  const result: string[] = [];
  let insideQuote = false;
  let entry = '';
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (insideQuote && line[i + 1] === '"') {
        entry += '"';
        i++;
      } else {
        insideQuote = !insideQuote;
      }
    } else if (char === ',' && !insideQuote) {
      result.push(entry.trim());
      entry = '';
    } else {
      entry += char;
    }
  }
  result.push(entry.trim());
  return result;
};

const cleanStr = (s: string) => String(s || '').toLowerCase().replace(/['"״׳`\-\s()]/g, '');

export interface SyncRealFixturesResult {
  success: boolean;
  count: number;
  message: string;
}

export const syncRealFixturesFromSheet = async (customUrl?: string): Promise<SyncRealFixturesResult> => {
  try {
    const url = customUrl || CSV_URL;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const csvText = await response.text();
    const lines = csvText.split('\n').map(l => l.trim());
    const parsedMatches: any[] = [];

    for (let i = 0; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i]);
      if (!cols || cols.length < 6) continue;
      if (!cols[0].includes('מחזור')) continue;
      if (cols[0].includes('#VALUE') || cols[0].includes('סחזור')) continue;

      const homeTeam = cols[4] || '';
      const awayTeam = cols[5] || '';
      if (!homeTeam || !awayTeam || homeTeam === 'קבוצת בית' || awayTeam === 'קבוצת חוץ') continue;

      const roundNum = parseInt(cols[0].replace(/[^\d]/g, ''), 10) || 1;
      const dateStr = formatMatchDateDisplay(cols[1] || '');
      const dayStr = cols[2] || '';
      const timeStr = cols[3] || '';
      const competition = cols[6] || 'ליגת WINNER';
      const stadium = cols[7] || '';
      const tvChannel = cols[8] || '';
      const statusRaw = cols[9] || 'עתידי';

      let status = statusRaw;
      let homeScore: number | null = null;
      let awayScore: number | null = null;

      const scoreMatch = statusRaw.match(/\((\d+)\s*[:\-\u2013]\s*(\d+)\)/) ||
                         statusRaw.match(/(\d+)\s*[:\-\u2013]\s*(\d+)/);
      if (scoreMatch) {
        homeScore = parseInt(scoreMatch[1], 10);
        awayScore = parseInt(scoreMatch[2], 10);
        status = 'הסתיים';
      } else if (statusRaw.includes('הסתיים')) {
        status = 'הסתיים';
      }

      const matchId = `sheet_match_${roundNum}_${cleanStr(homeTeam)}_${cleanStr(awayTeam)}`;

      const matchItem: any = {
        id: matchId,
        round: roundNum,
        roundStage: `מחזור ${roundNum}`,
        date: dateStr,
        day: dayStr,
        time: timeStr,
        homeTeam,
        awayTeam,
        competition,
        stadium,
        tvChannel,
        status,
        homeScore,
        awayScore,
        hs: homeScore,
        as: awayScore
      };

      parsedMatches.push(matchItem);
    }

    if (parsedMatches.length > 0) {
      // Fetch existing matches to preserve custom manual edits if necessary
      const docRef = doc(db, 'leagueData', 'real_fixtures');
      const snap = await getDoc(docRef);
      let mergedMatches = [...parsedMatches];

      if (snap.exists() && Array.isArray(snap.data().matches)) {
        const existing = snap.data().matches;
        // Merge existing manual scores/edits if sheet score is null
        mergedMatches = parsedMatches.map(pm => {
          const ex = existing.find((e: any) => e.id === pm.id || (e.round === pm.round && cleanStr(e.homeTeam) === cleanStr(pm.homeTeam) && cleanStr(e.awayTeam) === cleanStr(pm.awayTeam)));
          if (ex) {
            return {
              ...ex,
              ...pm,
              // If sheet didn't specify score, keep existing score if available
              hs: pm.hs !== null ? pm.hs : ex.hs,
              as: pm.as !== null ? pm.as : ex.as,
              homeScore: pm.homeScore !== null ? pm.homeScore : ex.homeScore,
              awayScore: pm.awayScore !== null ? pm.awayScore : ex.awayScore,
              stadium: pm.stadium || ex.stadium,
              tvChannel: pm.tvChannel || ex.tvChannel,
              time: pm.time || ex.time,
              date: pm.date || ex.date
            };
          }
          return pm;
        });
      }

      // Sort all matches chronologically
      const sortedMatches = sortMatchesChronologically(mergedMatches);

      await setDoc(docRef, { matches: sortedMatches, lastUpdated: new Date().toISOString() }, { merge: true });

      return {
        success: true,
        count: sortedMatches.length,
        message: `✓ סונכרנו בהצלחה ${sortedMatches.length} משחקי ליגת העל מקובץ ה-Google Sheet!`
      };
    }

    return {
      success: false,
      count: 0,
      message: 'לא נמצאו משחקים בקובץ ה-Google Sheet'
    };
  } catch (err: any) {
    console.error('Error syncing real fixtures from sheet:', err);
    return {
      success: false,
      count: 0,
      message: `שגיאה בסנכרון מהאקסל: ${err?.message || err}`
    };
  }
};
