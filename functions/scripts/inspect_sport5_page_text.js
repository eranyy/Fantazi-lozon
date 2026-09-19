const axios = require('axios');
const cheerio = require('cheerio');
const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function inspectSport5PageText() {
  console.log('=== SCRAPING SPORT5 HOMEPAGE & MATCH TEXT FOR ASSISTS & GOALS ===');
  
  try {
    const res = await axios.get('https://www.sport5.co.il/', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      timeout: 8000
    });
    const $ = cheerio.load(res.data);

    // Look for all text elements containing 'שער', 'גול', '1:', '0:', 'בישול'
    const matchTexts = [];
    $('div, span, a, h1, h2, h3, p').each((i, el) => {
      const t = $(el).text().trim();
      if ((t.includes('1:') || t.includes('2:') || t.includes('3:') || t.includes('שער') || t.includes('בישול')) && t.length < 200) {
        matchTexts.push(t);
      }
    });

    console.log(`Found ${matchTexts.length} matching live text snippets on Sport5:`);
    const unique = Array.from(new Set(matchTexts)).slice(0, 20);
    unique.forEach((ut, idx) => console.log(`${idx + 1}. ${ut}`));

    // Also check pending events in live_pending_events collection
    const pendingSnap = await db.collection('live_pending_events').get();
    console.log(`\nPending events in live_pending_events collection: ${pendingSnap.size}`);
    pendingSnap.docs.forEach(doc => {
      const d = doc.data();
      console.log(`  - ${d.player} (${d.realTeam}) | Type: ${d.eventType} | Status: ${d.status} | Source: ${d.source}`);
    });

  } catch (e) {
    console.error('Error fetching page text:', e.message);
  }
  process.exit(0);
}

inspectSport5PageText();
