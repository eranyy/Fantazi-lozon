const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function syncScoreKeys() {
  console.log('=== SYNCING SCORE KEYS (homeScore/awayScore & hs/as) IN REAL_FIXTURES ===\n');

  const fixRef = db.doc('leagueData/real_fixtures');
  const fixSnap = await fixRef.get();
  if (!fixSnap.exists) {
    console.log('❌ real_fixtures doc does not exist!');
    process.exit(1);
  }

  const matches = fixSnap.data()?.matches || [];
  const updatedMatches = matches.map(m => {
    const hs = m.homeScore ?? m.hs ?? null;
    const as = m.awayScore ?? m.as ?? null;
    if (hs !== null && as !== null) {
      return {
        ...m,
        homeScore: hs,
        awayScore: as,
        hs: hs,
        as: as,
        status: 'הסתיים'
      };
    }
    return m;
  });

  await fixRef.set({
    matches: updatedMatches,
    lastUpdated: new Date().toISOString(),
    updatedBy: 'Score Keys Synchronizer'
  }, { merge: true });

  console.log('✅ Successfully synchronized score keys across all real fixtures in Firestore!');
  process.exit(0);
}

syncScoreKeys();
