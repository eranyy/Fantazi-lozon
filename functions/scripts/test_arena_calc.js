const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function testArenaCalc() {
  const usersSnap = await db.collection('users').get();
  console.log('=== ARENA ROUND 1 TEST CALCULATION ===');
  
  usersSnap.forEach(docSnap => {
    const teamId = docSnap.id;
    if (teamId === 'admin' || teamId === 'system') return;
    const team = docSnap.data();
    const r1Data = team.lineupsByRound?.[1];
    
    if (!r1Data || !r1Data.lineup) {
      console.log(`Team ${teamId}: NO ROUND 1 LINEUP`);
      return;
    }
    
    let total = 0;
    r1Data.lineup.forEach(p => {
      total += (p.points || 0);
    });

    console.log(`Team: ${team.teamName || teamId}`);
    console.log(`  Round 1 Starters (${r1Data.lineup.length}):`, r1Data.lineup.map(p => `${p.name} (${p.points || 0} pts)`).join(', '));
    console.log(`  TOTAL ROUND 1 POINTS: ${total}`);
  });
}

testArenaCalc().catch(console.error);
