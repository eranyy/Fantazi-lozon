import { db } from '../firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { sortMatchesChronologically, formatMatchDateDisplay } from './dateUtils';

const SPREADSHEET_ID = '14kSevz6bRm_4xX1jGxGztB0ZDVm8po01tXujvZBgf-s';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&gid=744687763`;

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

    const isCupStageLabel = (str: string) => /גביע|סיבוב|שמינית|רבע|חצי|גמר/i.test(str || '');

    for (let i = 0; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i]);
      if (!cols || cols.length < 6) continue;
      const col0 = (cols[0] || '').trim();
      const col6 = (cols[6] || '').trim();
      const isLeagueRow = col0.includes('מחזור');
      const isCupRow = isCupStageLabel(col0) || isCupStageLabel(col6);
      if (!isLeagueRow && !isCupRow) continue;
      if (col0.includes('#VALUE') || col0.includes('סחזור')) continue;

      const homeTeam = cols[4] || '';
      const awayTeam = cols[5] || '';
      if (!homeTeam || !awayTeam || homeTeam === 'קבוצת בית' || awayTeam === 'קבוצת חוץ') continue;

      const parsedRoundDigits = parseInt(col0.replace(/[^\d]/g, ''), 10);
      const roundNum = !isNaN(parsedRoundDigits) && parsedRoundDigits > 0 ? parsedRoundDigits : (isCupRow ? 0 : 1);
      const dateStr = formatMatchDateDisplay(cols[1] || '');
      const dayStr = cols[2] || '';
      const timeStr = cols[3] || '';
      const competition = col6 || (isCupRow && !isLeagueRow ? 'גביע המדינה' : 'ליגת WINNER');
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

      const stageKey = isCupRow && !isLeagueRow ? cleanStr(col0 || 'cup') : String(roundNum);
      const matchId = `sheet_match_${stageKey}_${cleanStr(homeTeam)}_${cleanStr(awayTeam)}`;

      const matchItem: any = {
        id: matchId,
        round: roundNum,
        roundStage: isCupRow && !isLeagueRow ? (col0 || 'גביע המדינה') : `מחזור ${roundNum}`,
        isCupMatch: isCupRow,
        date: dateStr || '',
        day: dayStr || '',
        time: timeStr || '20:00',
        homeTeam: homeTeam || '',
        awayTeam: awayTeam || '',
        competition: competition || 'ליגת WINNER',
        stadium: stadium || '',
        tvChannel: tvChannel || '',
        status: status || 'עתידי',
        homeScore: homeScore !== null ? homeScore : null,
        awayScore: awayScore !== null ? awayScore : null,
        hs: homeScore !== null ? homeScore : null,
        as: awayScore !== null ? awayScore : null
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
            const hasExScore = (ex.hs !== undefined && ex.hs !== null && ex.hs !== '') || (ex.homeScore !== undefined && ex.homeScore !== null);
            const isExFinished = ex.status === 'הסתיים' || hasExScore;
            const pmFinished = pm.status === 'הסתיים' || pm.hs !== null;

            return {
              ...ex,
              ...pm,
              status: pmFinished ? 'הסתיים' : (isExFinished ? 'הסתיים' : (pm.status || ex.status || 'עתידי')),
              // If sheet didn't specify score, keep existing score if available
              hs: pm.hs !== null && pm.hs !== undefined ? pm.hs : (ex.hs !== undefined && ex.hs !== null ? ex.hs : null),
              as: pm.as !== null && pm.as !== undefined ? pm.as : (ex.as !== undefined && ex.as !== null ? ex.as : null),
              homeScore: pm.homeScore !== null && pm.homeScore !== undefined ? pm.homeScore : (ex.homeScore !== undefined && ex.homeScore !== null ? ex.homeScore : null),
              awayScore: pm.awayScore !== null && pm.awayScore !== undefined ? pm.awayScore : (ex.awayScore !== undefined && ex.awayScore !== null ? ex.awayScore : null),
              stadium: pm.stadium || ex.stadium || '',
              tvChannel: pm.tvChannel || ex.tvChannel || '',
              time: pm.time || ex.time || '20:00',
              date: pm.date || ex.date || ''
            };
          }
          return pm;
        });
      }

      // Helper to strip any undefined fields that crash Firestore web client SDK
      const sanitizeForFirestore = (obj: any): any => {
        if (Array.isArray(obj)) {
          return obj.map(sanitizeForFirestore);
        }
        if (obj !== null && typeof obj === 'object') {
          const clean: Record<string, any> = {};
          for (const [key, value] of Object.entries(obj)) {
            if (value !== undefined) {
              clean[key] = sanitizeForFirestore(value);
            }
          }
          return clean;
        }
        return obj ?? null;
      };

      // Sort all matches chronologically
      const sortedMatches = sortMatchesChronologically(mergedMatches);
      const cleanMatches = sanitizeForFirestore(sortedMatches);

      await setDoc(docRef, { matches: cleanMatches, lastUpdated: new Date().toISOString() }, { merge: true });

      // Automatically keep currentRound updated if all matches of the current round have ended
      try {
        const settingsRef = doc(db, 'leagueData', 'settings');
        const settingsSnap = await getDoc(settingsRef);
        if (settingsSnap.exists()) {
          const curRound = settingsSnap.data().currentRound || 1;
          const curRoundMatches = cleanMatches.filter((m: any) => Number(m.round) === curRound);
          const allCurFinished = curRoundMatches.length > 0 && curRoundMatches.every((m: any) => m.status === 'הסתיים');
          const hasNextRoundMatches = cleanMatches.some((m: any) => Number(m.round) === curRound + 1);
          if (allCurFinished && hasNextRoundMatches) {
            await setDoc(settingsRef, { currentRound: curRound + 1 }, { merge: true });
          }
        }
      } catch (roundErr) {
        console.warn('Could not auto-advance currentRound:', roundErr);
      }

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
