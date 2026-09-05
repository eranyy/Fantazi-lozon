const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();
const axios = require('axios');

const formatMatchDateDisplay = (dateStr) => {
  if (!dateStr) return '';
  const str = String(dateStr).trim();
  if (str.includes('טרם') || str.includes('נדחה') || str.includes('ייקבע')) return str;

  const isoMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (isoMatch) {
    return `${isoMatch[3].padStart(2, '0')}/${isoMatch[2].padStart(2, '0')}/${isoMatch[1]}`;
  }
  const dmyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    return `${dmyMatch[1].padStart(2, '0')}/${dmyMatch[2].padStart(2, '0')}/${dmyMatch[3]}`;
  }
  return str;
};

const parseCsvLine = (line) => {
  const result = [];
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

async function syncFixturesNow() {
  console.log('=== RUNNING LIVE GOOGLE SHEET FIXTURES SYNC ===\n');

  const spreadsheetId = '14kSevz6bRm_4xX1jGxGztB0ZDVm8po01tXujvZBgf-s';
  const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&gid=0`;

  const res = await axios.get(csvUrl);
  const lines = res.data.split('\n').map(l => l.trim());
  const parsedMatches = [];

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
    let homeScore = null;
    let awayScore = null;

    const scoreMatch = statusRaw.match(/\((\d+)\s*[-\u2013]\s*(\d+)\)/) || statusRaw.match(/(\d+)\s*[-\u2013]\s*(\d+)/);
    if (scoreMatch) {
      homeScore = parseInt(scoreMatch[1], 10);
      awayScore = parseInt(scoreMatch[2], 10);
      status = 'הסתיים';
    } else if (statusRaw.includes('הסתיים')) {
      status = 'הסתיים';
    }

    const matchId = `sheet_match_${roundNum}_${homeTeam.replace(/\s+/g, '_')}_${awayTeam.replace(/\s+/g, '_')}`;

    const matchItem = {
      id: matchId,
      round: roundNum,
      date: dateStr,
      day: dayStr,
      time: timeStr,
      homeTeam,
      awayTeam,
      competition,
      stadium,
      tvChannel,
      status,
      homeScore: homeScore !== undefined ? homeScore : null,
      awayScore: awayScore !== undefined ? awayScore : null,
      hs: homeScore !== undefined ? homeScore : null,
      as: awayScore !== undefined ? awayScore : null
    };

    parsedMatches.push(matchItem);
  }

  console.log(`Parsed ${parsedMatches.length} real fixtures from Google Sheet CSV!`);

  await db.doc('leagueData/real_fixtures').set({
    matches: parsedMatches,
    updatedAt: new Date().toISOString()
  }, { merge: true });

  console.log('✅ Updated leagueData/real_fixtures in Firestore!');
  process.exit(0);
}

syncFixturesNow();
