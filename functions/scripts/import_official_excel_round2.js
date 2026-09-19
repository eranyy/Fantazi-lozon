const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();
const axios = require('axios');

const cleanStr = (s) => String(s || '').toLowerCase().replace(/['"״׳`\-\s().]/g, '');

async function importOfficialRound2() {
  console.log('=== IMPORTING OFFICIAL ROUND 2 SCORES & PLAYER STATS FROM EXCEL ===\n');

  const spreadsheetId = '1Ru6w8bk7G1Mx_uPHyEuEKEeqseLqVj0NuOhMdCExiYQ';
  const gid = '1846967038'; // מחזור 2
  const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;

  const res = await axios.get(csvUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });

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

  const lines = res.data.split('\n').map(l => l.trim());

  // Map sheet team names to Firestore team IDs
  const teamIdMap = {
    'תומאלי': 'tumali',
    'טמפה': 'tampa',
    'חמסילי': 'hamsili',
    'פיציצי': 'pichichi',
    'פיצ\'יצ\'י': 'pichichi',
    'חולוניה': 'holonia',
    'חראלה': 'harale'
  };

  // Parse blocks per team
  const teamBlocks = {};
  let currentTeamName = null;
  let currentPlayers = [];

  for (let i = 0; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (!cols || cols.length < 5) continue;

    const col0 = cols[0]?.trim();
    if (col0 && teamIdMap[col0]) {
      if (currentTeamName && currentPlayers.length > 0) {
        teamBlocks[teamIdMap[currentTeamName]] = currentPlayers;
      }
      currentTeamName = col0;
      currentPlayers = [];
      continue;
    }

    if (currentTeamName) {
      const playerName = cols[3]?.trim();
      const pointsStr = cols[13]?.trim();
      if (playerName && playerName !== 'הרכב' && playerName !== 'מחליף' && !playerName.includes('חילופים') && !playerName.includes('סיכום')) {
        const pts = parseInt(pointsStr, 10);
        if (!isNaN(pts)) {
          currentPlayers.push({
            rawName: playerName,
            pts: pts
          });
        }
      }
      if (cols[2]?.trim() === 'סיכום' || cols[14]?.trim() === 'סיכום') {
        if (currentTeamName && currentPlayers.length > 0) {
          teamBlocks[teamIdMap[currentTeamName]] = currentPlayers;
        }
        currentTeamName = null;
        currentPlayers = [];
      }
    }
  }

  console.log('Parsed team blocks from sheet:');
  Object.keys(teamBlocks).forEach(tId => {
    console.log(`  Team ${tId}: ${teamBlocks[tId].length} players -> Total Pts: ${teamBlocks[tId].reduce((s, p) => s + p.pts, 0)}`);
    teamBlocks[tId].forEach(p => console.log(`     - ${p.rawName}: ${p.pts} pts`));
  });

  // Now update Firestore for each team
  const usersSnap = await db.collection('users').get();
  for (const doc of usersSnap.docs) {
    const tId = doc.id;
    const sheetPlayers = teamBlocks[tId];
    if (!sheetPlayers || sheetPlayers.length === 0) continue;

    const u = doc.data();
    const lineup = u.published_lineup || u.lineup || u.squad || [];

    const updatedLineup = lineup.map((pl) => {
      const plClean = cleanStr(pl.name);
      const match = sheetPlayers.find(sp => {
        const spClean = cleanStr(sp.rawName);
        return plClean === spClean || plClean.includes(spClean) || spClean.includes(plClean);
      });
      if (match) {
        return {
          ...pl,
          points: match.pts,
          stats: {
            ...(pl.stats || {}),
            played: true
          }
        };
      }
      return pl;
    });

    const currentLineupsByRound = u.lineupsByRound || {};
    const r2Data = currentLineupsByRound[2] || currentLineupsByRound['2'] || {};

    const updatedR2Lineup = (r2Data.lineup || lineup).map((pl) => {
      const plClean = cleanStr(pl.name);
      const match = sheetPlayers.find(sp => {
        const spClean = cleanStr(sp.rawName);
        return plClean === spClean || plClean.includes(spClean) || spClean.includes(plClean);
      });
      if (match) {
        return {
          ...pl,
          points: match.pts,
          stats: {
            ...(pl.stats || {}),
            played: true
          }
        };
      }
      return pl;
    });

    await doc.ref.set({
      published_lineup: updatedR2Lineup,
      lineup: updatedR2Lineup,
      lineupsByRound: {
        ...currentLineupsByRound,
        2: {
          ...r2Data,
          round: 2,
          lineup: updatedR2Lineup
        }
      }
    }, { merge: true });

    const totalPts = updatedR2Lineup.reduce((sum, pl) => sum + (Number(pl.points) || 0), 0);
    console.log(`✅ Updated Firestore for team ${tId} (${u.teamName}) -> Total R2 Points: ${totalPts}`);
  }

  console.log('\n✅ All 6 teams updated in Firestore with Round 2 official scores!');
  process.exit(0);
}

importOfficialRound2();
