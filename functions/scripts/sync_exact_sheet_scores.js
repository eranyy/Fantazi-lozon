const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();
const axios = require('axios');

async function syncExactSheetScores() {
  console.log('=== SYNCING EXACT SCORES DIRECTLY FROM GOOGLE SHEET CSV ===\n');

  const primaryUrl = 'https://docs.google.com/spreadsheets/d/14kSevz6bRm_4xX1jGxGztB0ZDVm8po01tXujvZBgf-s/gviz/tq?tqx=out:csv';
  const res = await axios.get(primaryUrl);
  const csvData = res.data;

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

  const lines = csvData.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const matches = [];
  const cupMatches = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (cols.length < 6) continue;

    const roundStage = cols[0];
    const dateStr = cols[1];
    const dayStr = cols[2];
    const timeStr = cols[3];
    const homeTeam = cols[4];
    const awayTeam = cols[5];
    const competition = cols[6] || '';
    const stadium = cols[7] || '';
    const tvChannel = cols[8] || '';
    const statusRaw = cols[9] || 'עתידי';

    let status = statusRaw;
    let homeScore = undefined;
    let awayScore = undefined;

    const scoreMatch = statusRaw.match(/\((\d+)\s*[-\u2013]\s*(\d+)\)/) || statusRaw.match(/(\d+)\s*[-\u2013]\s*(\d+)/);
    if (scoreMatch) {
      homeScore = parseInt(scoreMatch[1], 10);
      awayScore = parseInt(scoreMatch[2], 10);
      status = 'הסתיים';
    }

    const roundNum = parseInt(cols[0].replace(/[^\d]/g, ''), 10) || 1;

    const matchItem = {
      round: roundNum,
      roundStage,
      date: dateStr,
      day: dayStr,
      time: timeStr,
      homeTeam,
      awayTeam,
      competition,
      stadium,
      tvChannel,
      status
    };

    if (homeScore !== undefined && awayScore !== undefined) {
      matchItem.homeScore = homeScore;
      matchItem.awayScore = awayScore;
      matchItem.hs = homeScore;
      matchItem.as = awayScore;
    }

    if (competition.includes('גביע')) {
      cupMatches.push(matchItem);
    } else {
      matches.push(matchItem);
    }
  }

  await db.doc('leagueData/real_fixtures').set({
    matches,
    cupMatches,
    lastUpdated: new Date().toISOString(),
    updatedBy: 'Exact Google Sheet Sync Script'
  }, { merge: true });

  console.log(`✅ Successfully synced ${matches.length} real matches and ${cupMatches.length} cup matches from Google Sheet!`);
  matches.forEach(m => {
    if (m.homeScore !== undefined) {
      console.log(`  [Round ${m.round}] ${m.homeTeam} ${m.homeScore} - ${m.awayScore} ${m.awayTeam} (${m.status})`);
    }
  });

  process.exit(0);
}

syncExactSheetScores();
