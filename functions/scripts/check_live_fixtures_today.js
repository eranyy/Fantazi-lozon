const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();
const axios = require('axios');
const cheerio = require('cheerio');

async function checkLiveToday() {
  console.log('=== CHECKING TODAY REAL FIXTURES & LIVE SCRAPER STATUS ===');
  
  const snap = await db.doc('leagueData/real_fixtures').get();
  if (snap.exists) {
    const matches = snap.data().matches || [];
    console.log(`Total fixtures in real_fixtures: ${matches.length}`);
    
    const now = new Date();
    const todayStr = '29/08/2026';
    
    const todayMatches = matches.filter(m => String(m.date || '').replace(/\./g, '/').includes(todayStr));
    console.log(`\nMatches scheduled for today (${todayStr}):`);
    todayMatches.forEach(m => {
      console.log(`  - ${m.homeTeam} 🆚 ${m.awayTeam} בשעה ${m.time} | ערוץ: ${m.channel || 'ספורט 5'}`);
    });
  }

  console.log('\nTesting Sport5 Live Ticker scan...');
  try {
    const res = await axios.get('https://www.sport5.co.il/', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      timeout: 5000
    });
    const $ = cheerio.load(res.data);
    const tickerText = $('.ticker, .live-matches, .game-item, .match-ticker').text().trim() || 'No ticker content found';
    console.log(`Sport5 Ticker snippet length: ${tickerText.length}`);
  } catch (err) {
    console.error('Sport5 scan error:', err.message);
  }

  process.exit(0);
}

checkLiveToday();
