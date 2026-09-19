const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function debugScraper() {
  console.log('=== DEBUGGING LIVE SCRAPER MATCHES & CALENDAR ===\n');

  const fixturesSnap = await db.doc('leagueData/real_fixtures').get();
  if (!fixturesSnap.exists) {
    console.log('❌ leagueData/real_fixtures doc does not exist!');
    process.exit(0);
  }

  const matches = fixturesSnap.data()?.matches || [];
  console.log(`Total real_fixtures matches count: ${matches.length}`);

  const now = new Date();
  const todayStr = now.toLocaleDateString('he-IL', { timeZone: 'Asia/Jerusalem' });
  console.log(`Current Date string (Asia/Jerusalem): "${todayStr}"`);

  let activeCount = 0;
  matches.forEach((m, idx) => {
    const mDateNorm = String(m.date || '').replace(/\./g, '/');
    const todayNorm = String(todayStr || '').replace(/\./g, '/');

    const isToday = mDateNorm.includes(todayNorm) || todayNorm.includes(mDateNorm);
    if (isToday) {
      activeCount++;
      console.log(`  Match ${idx + 1}: ${m.homeTeam} vs ${m.awayTeam} | date="${m.date}", time="${m.time}" | Round=${m.round}`);
    }
  });

  console.log(`\nMatches matching today's date ("${todayStr}"): ${activeCount}`);
  if (activeCount === 0) {
    console.log('\nSample 5 matches from real_fixtures:');
    matches.slice(0, 5).forEach((m, idx) => {
      console.log(`  Match ${idx + 1}: ${m.homeTeam} vs ${m.awayTeam} | date="${m.date}", time="${m.time}" | Round=${m.round}`);
    });
  }

  process.exit(0);
}

debugScraper();
