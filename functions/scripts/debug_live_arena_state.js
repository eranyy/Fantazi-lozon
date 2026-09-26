const admin = require('firebase-admin');
if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'fantasy-luzon' });
}
const db = admin.firestore();

async function debugState() {
  console.log('=== DEBUGGING LIVE ARENA FIRESTORE STATE ===');
  
  const settingsSnap = await db.collection('leagueData').doc('settings').get();
  console.log('leagueData/settings:', settingsSnap.exists ? settingsSnap.data() : 'MISSING');

  const fixturesSnap = await db.collection('leagueData').doc('fixtures').get();
  if (fixturesSnap.exists) {
    const rounds = fixturesSnap.data().rounds || [];
    console.log('\nleagueData/fixtures rounds:');
    rounds.forEach((r, idx) => {
      console.log(`  Round ${r.round || idx + 1}: isPlayed = ${r.isPlayed}, matches count = ${(r.matches || []).length}`);
    });
  } else {
    console.log('leagueData/fixtures: MISSING');
  }

  const hamsiliSnap = await db.collection('users').doc('hamsili').get();
  if (hamsiliSnap.exists) {
    const h = hamsiliSnap.data();
    console.log('\nHamsili user doc:');
    console.log('  published_lineup:', (h.published_lineup || []).length);
    console.log('  lineup:', (h.lineup || []).length);
    console.log('  squad:', (h.squad || []).length);
    console.log('  lineupsByRound keys:', Object.keys(h.lineupsByRound || {}));
  }

  process.exit(0);
}

debugState().catch(err => {
  console.error(err);
  process.exit(1);
});
