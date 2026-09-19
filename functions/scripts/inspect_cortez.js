const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function inspectCortez() {
  console.log('--- SEARCHING ALL USERS FOR CORTEZ OR ALL PLAYERS IN ROUND 1 LINEUPS ---');
  const usersSnap = await db.collection('users').get();
  usersSnap.forEach(docSnap => {
    const u = docSnap.data();
    if (docSnap.id === 'admin' || docSnap.id === 'system') return;

    console.log(`\nUser: ${u.teamName || docSnap.id} (${u.name || ''}):`);
    if (u.lineupsByRound && u.lineupsByRound[1]) {
      const l1 = u.lineupsByRound[1].lineup || [];
      console.log(`  Round 1 Lineup (${l1.length} players):`, l1.map(p => `${p.name} (${p.team || p.realTeam || 'no team'}, pts: ${p.points || 0})`).join(', '));
    }
  });
}

inspectCortez().catch(console.error);
