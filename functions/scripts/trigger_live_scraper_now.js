const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();
const axios = require('axios');
const cheerio = require('cheerio');

const norm = (str) => String(str || '').toLowerCase().replace(/['"״׳\sאע]/g, '').replace(/יי/g, 'י');

async function testLiveScraperNow() {
  console.log('=== TESTING LIVE SCRAPER RIGHT NOW (21:30) ===\n');

  // 1. Check real_fixtures matches
  const fixturesSnap = await db.doc('leagueData/real_fixtures').get();
  const matches = fixturesSnap.data()?.matches || [];
  const now = new Date();

  const jerusalemDateStr = now.toLocaleDateString('he-IL', { timeZone: 'Asia/Jerusalem' });
  const parts = jerusalemDateStr.split('.');
  const dStr = (parts[0] || '').padStart(2, '0');
  const mStr = (parts[1] || '').padStart(2, '0');
  const yStr = parts[2] || '2026';

  const todayPadded = `${dStr}/${mStr}/${yStr}`;
  const todayRaw = `${parts[0]}/${parts[1]}/${yStr}`;

  console.log(`Current Date: ${todayPadded} | Checking matches...`);

  let activeMatch = null;
  for (const m of matches) {
    const mDateNorm = String(m.date || '').replace(/\./g, '/').trim();
    if (mDateNorm === todayPadded || mDateNorm === todayRaw) {
      console.log(`  • Today match: ${m.homeTeam} vs ${m.awayTeam} (${m.time})`);
      const [hourStr, minStr] = String(m.time || '20:00').split(':');
      const matchHour = parseInt(hourStr || '20', 10);
      const matchMin = parseInt(minStr || '0', 10);

      const nowHour = parseInt(now.toLocaleTimeString('he-IL', { timeZone: 'Asia/Jerusalem', hour: '2-digit', hour12: false }), 10);
      const nowMin = parseInt(now.toLocaleTimeString('he-IL', { timeZone: 'Asia/Jerusalem', minute: '2-digit' }), 10);

      const nowTotalMins = nowHour * 60 + nowMin;
      const matchTotalMins = matchHour * 60 + matchMin;

      if (nowTotalMins >= (matchTotalMins - 15) && nowTotalMins <= (matchTotalMins + 210)) {
        activeMatch = m;
        console.log(`    🔥 ACTIVE LIVE MATCH NOW! (${m.homeTeam} נגד ${m.awayTeam})`);
      }
    }
  }

  // Fetch ALL tracked players
  const realPlayersSnap = await db.collection('real_league_players_scoring').get();
  const allTrackedPlayers = [];
  realPlayersSnap.docs.forEach(d => {
    const data = d.data();
    if (data.name) {
      allTrackedPlayers.push({ name: data.name, realTeam: data.realTeam || data.team || '', isDrafted: Boolean(data.isDrafted) });
    }
  });

  console.log(`\nTotal tracked players in DB: ${allTrackedPlayers.length}`);

  // Fetch Sport5 ticker page
  try {
    console.log('\nScanning Sport5 live scores ticker...');
    const sp5Res = await axios.get('https://www.sport5.co.il/html/pages/live-match-ticker.html', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      timeout: 8000
    });
    const $ = cheerio.load(sp5Res.data);
    const textContent = $('body').text();
    console.log(`Sport5 page text length: ${textContent.length} chars`);

    allTrackedPlayers.forEach(pl => {
      const pNorm = norm(pl.name);
      if (pNorm.length >= 3 && norm(textContent).includes(pNorm)) {
        console.log(`  ⚽ Found player mention in Sport5: "${pl.name}" (${pl.realTeam})`);
      }
    });
  } catch (err) {
    console.error('Sport5 scan error:', err.message);
  }

  process.exit(0);
}

testLiveScraperNow();
