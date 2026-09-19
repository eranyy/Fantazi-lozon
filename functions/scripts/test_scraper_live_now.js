const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();
const axios = require('axios');
const cheerio = require('cheerio');

const norm = (str) => String(str || '').toLowerCase().replace(/['"״׳\sאע]/g, '').replace(/יי/g, 'י').replace(/וו/g, 'ו');

async function testFullScraperNow() {
  console.log('=== TESTING REAL-TIME SCRAPER AGAINST SPORT5, ONE, WALLA ===\n');

  const realPlayersSnap = await db.collection('real_league_players_scoring').get();
  const allTrackedPlayers = [];
  realPlayersSnap.docs.forEach(d => {
    const data = d.data();
    if (data.name) {
      allTrackedPlayers.push({ name: data.name, realTeam: data.realTeam || data.team || '', isDrafted: Boolean(data.isDrafted) });
    }
  });

  console.log(`Tracked players count: ${allTrackedPlayers.length}`);

  const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  const sites = [
    { name: 'Sport5', url: 'https://www.sport5.co.il/' },
    { name: 'ONE', url: 'https://www.one.co.il/' },
    { name: 'Walla Sports', url: 'https://sports.walla.co.il/' }
  ];

  for (const site of sites) {
    try {
      const res = await axios.get(site.url, { headers: { 'User-Agent': userAgent }, timeout: 8000 });
      const $ = cheerio.load(res.data);
      const text = $('body').text();
      const textNorm = norm(text);

      console.log(`\n🔍 Scanning ${site.name}... (${text.length} chars)`);

      const matchesFound = [];
      allTrackedPlayers.forEach(pl => {
        const pNorm = norm(pl.name);
        if (pNorm.length >= 3 && textNorm.includes(pNorm)) {
          // Verify it's not a common sub-word
          if (!['דוד', 'בן', 'חי', 'אלי'].includes(pNorm)) {
            matchesFound.push(`${pl.name} (${pl.realTeam})`);
          }
        }
      });

      console.log(`  Found ${matchesFound.length} player mentions on ${site.name}:`, matchesFound.join(', '));
    } catch (err) {
      console.error(`Error scanning ${site.name}:`, err.message);
    }
  }

  process.exit(0);
}

testFullScraperNow();
