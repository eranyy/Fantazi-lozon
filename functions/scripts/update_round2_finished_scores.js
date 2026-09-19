const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function updateFinishedScores() {
  console.log('=== UPDATING YESTERDAY\'S ROUND 2 FINISHED SCORES (29/08/2026) ===\n');

  const fixRef = db.doc('leagueData/real_fixtures');
  const fixSnap = await fixRef.get();
  if (!fixSnap.exists) {
    console.log('❌ real_fixtures doc does not exist!');
    process.exit(1);
  }

  const matches = fixSnap.data()?.matches || [];
  const updatedMatches = matches.map(m => {
    if (m.round === 2 && m.date === '29/08/2026') {
      const hNorm = (m.homeTeam || '').trim();
      const aNorm = (m.awayTeam || '').trim();

      if (hNorm.includes('סכנין') || aNorm.includes('סכנין')) {
        return { ...m, homeScore: 2, awayScore: 0, status: 'הסתיים' };
      }
      if (hNorm.includes('הפועל פתח') || aNorm.includes('הפועל פתח')) {
        return { ...m, homeScore: 1, awayScore: 1, status: 'הסתיים' };
      }
      if (hNorm.includes('קריית שמונה') || hNorm.includes('קרית שמונה') || aNorm.includes('קריית שמונה')) {
        return { ...m, homeScore: 1, awayScore: 0, status: 'הסתיים' };
      }
      if (hNorm.includes('בית"ר') || hNorm.includes('ביתר') || aNorm.includes('בית"ר') || aNorm.includes('ביתר')) {
        return { ...m, homeScore: 1, awayScore: 1, status: 'הסתיים' };
      }
    }
    return m;
  });

  await fixRef.set({
    matches: updatedMatches,
    lastUpdated: new Date().toISOString(),
    updatedBy: 'Finished Scores Auto-Updater'
  }, { merge: true });

  console.log('✅ Successfully updated yesterday\'s Round 2 scores in real_fixtures!');
  process.exit(0);
}

updateFinishedScores();
