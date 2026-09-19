const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function checkSettings() {
  const snap = await db.doc('leagueData/settings').get();
  console.log('Settings doc data:', snap.data());

  const fixturesSnap = await db.doc('leagueData/fixtures').get();
  const rounds = fixturesSnap.data()?.rounds || [];
  console.log(`Total rounds in fixtures: ${rounds.length}`);
  rounds.slice(0, 3).forEach((r, idx) => {
    console.log(`Round ${r.round}: isPlayed=${r.isPlayed}, matches count=${(r.matches||[]).length}`);
    (r.matches || []).forEach(m => {
      console.log(`  - Match: ${m.h} 🆚 ${m.a} | Score: hs=${m.hs}, as=${m.as}`);
    });
  });

  process.exit(0);
}

checkSettings();
