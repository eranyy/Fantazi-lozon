const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

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

const cleanStr = (s) => String(s || '').toLowerCase().replace(/['"״׳`\-\s()]/g, '');

const parseMatchDateTime = (m) => {
  if (!m) return Infinity;
  const dateStr = String(m.date || '').trim();
  const timeStr = String(m.time || m.matchTime || '').trim();
  const statusStr = String(m.status || '').trim();

  if (!dateStr || dateStr.includes('נדחה') || statusStr.includes('נדחה')) return Infinity + 100000;
  if (dateStr.includes('טרם') || dateStr.includes('ייקבע')) return Infinity;

  let year = 2026, month = 0, day = 0;

  // 1. ISO format: YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = dateStr.match(/^(\d{4})[-/. ](\d{1,2})[-/. ](\d{1,2})/);
  if (isoMatch) {
    year = parseInt(isoMatch[1], 10);
    month = parseInt(isoMatch[2], 10) - 1;
    day = parseInt(isoMatch[3], 10);
  } else {
    // 2. DMY format: DD/MM/YYYY or DD-MM-YYYY
    const dmyMatch = dateStr.match(/(\d{1,2})[-/. ](\d{1,2})(?:[-/. ](\d{2,4}))?/);
    if (!dmyMatch) return Infinity;
    day = parseInt(dmyMatch[1], 10);
    month = parseInt(dmyMatch[2], 10) - 1;
    if (dmyMatch[3]) {
      year = parseInt(dmyMatch[3], 10);
      if (year < 100) year += 2000;
    }
  }

  let hours = 23, minutes = 59;
  const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    hours = parseInt(timeMatch[1], 10);
    minutes = parseInt(timeMatch[2], 10);
  }

  return new Date(year, month, day, hours, minutes).getTime();
};

const sortMatchesChronologically = (matches) => {
  return [...matches].sort((a, b) => parseMatchDateTime(a) - parseMatchDateTime(b));
};

async function testFetchSheet() {
  const url = 'https://docs.google.com/spreadsheets/d/14kSevz6bRm_4xX1jGxGztB0ZDVm8po01tXujvZBgf-s/gviz/tq?tqx=out:csv&gid=0';
  const response = await fetch(url);
  const csvText = await response.text();
  const lines = csvText.split('\n').map(l => l.trim());
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
    const dateStr = cols[1] || '';
    const dayStr = cols[2] || '';
    const timeStr = cols[3] || '';
    const competition = cols[6] || 'ליגת WINNER';
    const stadium = cols[7] || '';
    const tvChannel = cols[8] || '';
    const statusRaw = cols[9] || 'עתידי';

    let status = statusRaw;
    let homeScore = null, awayScore = null;

    const scoreMatch = statusRaw.match(/\((\d+)\s*[:\-\u2013]\s*(\d+)\)/) || statusRaw.match(/(\d+)\s*[:\-\u2013]\s*(\d+)/);
    if (scoreMatch) {
      homeScore = parseInt(scoreMatch[1], 10);
      awayScore = parseInt(scoreMatch[2], 10);
      status = 'הסתיים';
    } else if (statusRaw.includes('הסתיים')) {
      status = 'הסתיים';
    }

    const matchId = `sheet_match_${roundNum}_${cleanStr(homeTeam)}_${cleanStr(awayTeam)}`;

    parsedMatches.push({
      id: matchId, round: roundNum, roundStage: `מחזור ${roundNum}`,
      date: dateStr, day: dayStr, time: timeStr, homeTeam, awayTeam,
      competition, stadium, tvChannel, status, homeScore, awayScore, hs: homeScore, as: awayScore
    });
  }

  const r5Matches = parsedMatches.filter(m => m.round === 5);
  console.log('=== Round 5 Parsed Matches ===');
  const sortedR5 = sortMatchesChronologically(r5Matches);
  sortedR5.forEach(m => {
    console.log(`[${m.date} | ${m.time}] ${m.homeTeam} vs ${m.awayTeam} | Status: ${m.status} (${m.hs}-${m.as}) | Stadium: ${m.stadium} | TV: ${m.tvChannel}`);
  });

  const r6Matches = parsedMatches.filter(m => m.round === 6);
  console.log('\n=== Round 6 Parsed Matches ===');
  const sortedR6 = sortMatchesChronologically(r6Matches);
  sortedR6.forEach(m => {
    console.log(`[${m.date} | ${m.time}] ${m.homeTeam} vs ${m.awayTeam} | Status: ${m.status} | Stadium: ${m.stadium} | TV: ${m.tvChannel}`);
  });
  process.exit(0);
}

testFetchSheet();
