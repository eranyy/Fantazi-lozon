const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function checkRound() {
  console.log('=== CHECKING AND SETTING LEAGUEDATA/SETTINGS CURRENTROUND ===\n');

  const settingsRef = db.doc('leagueData/settings');
  const snap = await settingsRef.get();
  const data = snap.exists ? snap.data() : {};
  console.log(`Current round in settings doc: ${data.currentRound}`);

  await settingsRef.set({
    currentRound: 2
  }, { merge: true });

  console.log('✅ Verified and set currentRound: 2 in leagueData/settings!');
  process.exit(0);
}

checkRound();
