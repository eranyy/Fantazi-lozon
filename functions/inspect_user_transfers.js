const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function checkUserTransfersAndSquad() {
  const usersSnap = await db.collection('users').get();
  usersSnap.forEach(d => {
    const u = d.data();
    console.log(`=== User: ${d.id} (${u.teamName}) ===`);
    if (u.transfers) {
      console.log(`  transfers count: ${u.transfers.length}`);
      const r1Transfers = u.transfers.filter(t => t.round === 1);
      console.log(`  Round 1 transfers count: ${r1Transfers.length}`);
      r1Transfers.forEach(t => console.log('   ', t));
    }
    if (u.lineupsByRound) {
      console.log(`  lineupsByRound keys:`, Object.keys(u.lineupsByRound));
    }
    if (u.squad && u.squad.length > 0) {
      console.log(`  squad sample player stats:`, u.squad[0].name, u.squad[0].points, u.squad[0].stats);
    }
  });
}

checkUserTransfersAndSquad().catch(console.error);
