const admin = require('firebase-admin');
if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'fantasy-luzon' });
}
const db = admin.firestore();

async function checkAndResetRound6() {
  console.log('=== CHECKING AND RESETTING ROUND 6 LINEUPS FOR ALL TEAMS ===');
  const snap = await db.collection('users').get();
  
  for (const userDoc of snap.docs) {
    const data = userDoc.data();
    if (data.role === 'ADMIN' && !data.teamName) continue;

    console.log(`\nTeam ID: ${userDoc.id} | Team Name: ${data.teamName || data.name}`);
    console.log(`  published_lineup length: ${Array.isArray(data.published_lineup) ? data.published_lineup.length : 'undefined'}`);
    console.log(`  lineup length: ${Array.isArray(data.lineup) ? data.lineup.length : 'undefined'}`);
    
    const lByR = data.lineupsByRound || {};
    console.log(`  lineupsByRound keys: ${Object.keys(lByR).join(', ')}`);
    if (lByR['6'] || lByR[6]) {
      console.log(`  -> Round 6 lineup currently exists with ${(lByR['6']?.lineup || lByR[6]?.lineup || []).length} players! Clearing for fresh Round 6...`);
    }

    // Reset published_lineup, lineup, and remove Round 6 from lineupsByRound so pitch starts completely clean
    const updatedLineupsByRound = { ...lByR };
    delete updatedLineupsByRound['6'];
    delete updatedLineupsByRound[6];

    await db.collection('users').doc(userDoc.id).update({
      published_lineup: [],
      lineup: [],
      lineupsByRound: updatedLineupsByRound
    });
    console.log(`  ✅ Successfully reset Round 6 state for ${userDoc.id}`);
  }

  console.log('\n=== DONE! ALL TEAMS ARE NOW CLEAN FOR ROUND 6 ===');
  process.exit(0);
}

checkAndResetRound6().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
