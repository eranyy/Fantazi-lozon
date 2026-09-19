const axios = require('axios');
const cheerio = require('cheerio');
const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function checkRecentLiveGoals() {
  console.log('=== CHECKING RECENT LIVE GOALS & ASSISTS FROM SPORT5, ONE & IFA ===');

  try {
    const res = await axios.get('https://www.sport5.co.il/', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      timeout: 5000
    });
    const $ = cheerio.load(res.data);

    const tickerLines = [];
    $('.ticker-item, .game-item, .match-ticker, .live-match, .ticker, .article-title, .live-score').each((i, el) => {
      const txt = $(el).text().trim();
      if (txt && txt.length > 5) tickerLines.push(txt);
    });

    console.log(`Found ${tickerLines.length} ticker elements on Sport5.`);
    console.log('\nTop 15 Ticker Lines:');
    tickerLines.slice(0, 15).forEach((line, idx) => {
      console.log(`${idx + 1}. ${line}`);
    });
  } catch (err) {
    console.error('Sport5 fetch error:', err.message);
  }

  // Also check ONE
  try {
    const oneRes = await axios.get('https://www.one.co.il/', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      timeout: 5000
    });
    const $one = cheerio.load(oneRes.data);
    const oneLines = [];
    $one('.live-score, .ticker, .match-row, .game-box').each((i, el) => {
      const txt = $one(el).text().trim();
      if (txt && txt.length > 5) oneLines.push(txt);
    });
    console.log(`\nONE Ticker lines found: ${oneLines.length}`);
    oneLines.slice(0, 10).forEach((line, idx) => {
      console.log(`${idx + 1}. ${line}`);
    });
  } catch (err) {
    console.error('ONE fetch error:', err.message);
  }

  process.exit(0);
}

checkRecentLiveGoals();
