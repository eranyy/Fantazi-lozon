const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function checkFixtures() {
  const settingsSnap = await db.doc('leagueData/settings').get();
  const fixturesSnap = await db.doc('leagueData/fixtures').get();
  
  console.log('=== SETTINGS ===');
  console.log(settingsSnap.data());

  console.log('\n=== FIXTURES ===');
  const rounds = fixturesSnap.data()?.rounds || [];
  rounds.forEach((r) => {
    console.log(`Round ${r.round}: isPlayed = ${r.isPlayed}`);
  });

  process.exit(0);
}

checkFixtures();
