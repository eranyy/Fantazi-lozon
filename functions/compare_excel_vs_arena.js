const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();
const axios = require('axios');

const cleanStr = (s) => String(s || '').toLowerCase().replace(/['"״׳`\-\s().]/g, '');

async function compareExcelVsArena() {
  console.log('=== COMPARING EXCEL VS FIRESTORE FOR ALL 6 TEAMS IN ROUND 2 ===\n');

  // 1. Fetch Excel sheet
  const spreadsheetId = '1Ru6w8bk7G1Mx_uPHyEuEKEeqseLqVj0NuOhMdCExiYQ';
  const gid = '1846967038'; // מחזור 2
  const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
  const res = await axios.get(csvUrl);

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

  // Parse Excel totals
  const excelTotals = {};
  for (let i = 0; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (cols[2] === 'סיכום' || cols[14] === 'סיכום') {
      const pts = parseInt(cols[13] || cols[15], 10);
      // find team name above
      for (let j = i - 1; j >= Math.max(0, i - 20); j--) {
        const c0 = parseCsvLine(lines[j])[0];
        if (c0 && ['תומאלי', 'טמפה', 'חמסילי', 'פיציצי', 'פיצ\'יצ\'י', 'חולוניה', 'חראלה'].includes(c0)) {
          const tId = c0.includes('תומאלי') ? 'tumali' : c0.includes('טמפה') ? 'tampa' : c0.includes('חמס') ? 'hamsili' : c0.includes('פיצ') ? 'pichichi' : c0.includes('חולו') ? 'holonia' : 'harale';
          excelTotals[tId] = pts;
          break;
        }
      }
    }
  }

  console.log('Excel Sheet Final Totals row:');
  console.log(excelTotals);

  console.log('\nFirestore / Live Arena Calculated Totals for Round 2:');
  const usersSnap = await db.collection('users').get();
  usersSnap.docs.forEach(d => {
    const u = d.data();
    if (d.id === 'admin' || d.id === 'system') return;

    const r2Lineup = u.lineupsByRound?.[2]?.lineup || u.published_lineup || u.lineup || [];
    
    let totalPts = 0;
    r2Lineup.forEach(pl => {
      const pts = Number(pl.points) || 0;
      const isCapt = Boolean(pl.isCaptain || pl.captain);
      totalPts += isCapt ? pts * 2 : pts;
    });

    console.log(`Team: "${u.teamName || d.id}" (${u.manager}) -> Arena Total: ${totalPts} | Excel Total: ${excelTotals[d.id] || 'N/A'}`);
  });

  process.exit(0);
}

compareExcelVsArena();
