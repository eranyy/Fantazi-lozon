const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function inspectRealFixtures() {
  console.log('=== INSPECTING LEAGUEDATA/REAL_FIXTURES IN FIRESTORE ===\n');

  const fixSnap = await db.doc('leagueData/real_fixtures').get();
  if (fixSnap.exists) {
    const data = fixSnap.data();
    const matches = data.matches || [];
    console.log(`Total real fixtures in DB: ${matches.length}`);
    console.log(`Last Updated: ${data.lastUpdated || 'N/A'}`);

    const round2Matches = matches.filter(m => m.round === 2);
    console.log('\nRound 2 Matches:');
    round2Matches.forEach((m, i) => {
      console.log(`  ${i+1}. [${m.date}] ${m.homeTeam} ${m.homeScore ?? ''} - ${m.awayScore ?? ''} ${m.awayTeam} (Status: "${m.status}", Time: "${m.time}")`);
    });
  } else {
    console.log('❌ leagueData/real_fixtures document does not exist!');
  }

  process.exit(0);
}

inspectRealFixtures();
