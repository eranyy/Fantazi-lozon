const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function inspectAllR1Points() {
  console.log('--- INSPECTING ALL TEAMS ROUND 1 POINTS IN FIRESTORE ---');
  const usersSnap = await db.collection('users').get();
  usersSnap.forEach(docSnap => {
    const u = docSnap.data();
    if (docSnap.id === 'admin' || docSnap.id === 'system') return;

    const r1Data = u.lineupsByRound?.[1] || {};
    const lineup1 = r1Data.lineup || [];
    const pLineup = u.published_lineup || u.lineup || [];

    let r1Sum = 0;
    lineup1.forEach(p => { r1Sum += Number(p.points || 0); });

    let pSum = 0;
    pLineup.forEach(p => { pSum += Number(p.points || 0); });

    console.log(`\nTeam '${u.teamName || docSnap.id}' (doc ID: ${docSnap.id}):`);
    console.log(`  lineupsByRound[1] players count: ${lineup1.length}, total points: ${r1Sum}`);
    console.log(`  published_lineup players count: ${pLineup.length}, total points: ${pSum}`);
    
    if (lineup1.length > 0) {
      console.log('  lineupsByRound[1] breakdown:', lineup1.map(p => `${p.name}: ${p.points || 0}`).join(', '));
    }
  });
}

inspectAllR1Points().catch(console.error);
