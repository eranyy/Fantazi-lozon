const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();
const axios = require('axios');
const cheerio = require('cheerio');

const norm = (s) => String(s || '').toLowerCase().replace(/['"״׳`\-\s()]/g, '');

async function testLiveScraperRun() {
  console.log('=== RUNNING LIVE SCRAPER TEST RIGHT NOW (20:04) ===');

  const realPlayersSnap = await db.collection('real_league_players_scoring').get();
  const allTrackedPlayers = [];
  
  realPlayersSnap.docs.forEach(d => {
    const data = d.data();
    if (data.name) {
      allTrackedPlayers.push({
        id: d.id,
        name: data.name,
        realTeam: data.realTeam || data.team || '',
        isDrafted: Boolean(data.isDrafted),
        ownerTeam: data.ownerTeam
      });
    }
  });

  console.log(`Tracking ${allTrackedPlayers.length} real Premier League players...`);

  // Scan Sport5
  const sport5Res = await axios.get('https://www.sport5.co.il/', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    timeout: 5000
  }).catch(() => null);

  let detectedEvents = 0;
  if (sport5Res && sport5Res.data) {
    const $ = cheerio.load(sport5Res.data);
    const tickerText = $('.ticker, .live-matches, .game-item, .match-ticker, body').text();
    const tickerNorm = norm(tickerText);

    allTrackedPlayers.forEach(pl => {
      const plNorm = norm(pl.name);
      if (plNorm.length >= 4 && tickerNorm.includes(plNorm)) {
        console.log(`🔥 DETECTED LIVE MENTION/EVENT FOR PLAYER: ${pl.name} (${pl.realTeam})`);
        detectedEvents++;
      }
    });
  }

  console.log(`Scan completed! Total live mentions/events detected: ${detectedEvents}`);
  process.exit(0);
}

testLiveScraperRun();
