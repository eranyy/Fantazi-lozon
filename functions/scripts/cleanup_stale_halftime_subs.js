const admin = require('firebase-admin');

if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function cleanupStaleHalftimeSubs() {
  console.log('--- CLEANING UP STALE HALFTIME SUBS FOR ALL TEAMS ---');

  const usersSnap = await db.collection('users').get();

  for (const docSnap of usersSnap.docs) {
    const u = docSnap.data();
    if (docSnap.id === 'admin' || docSnap.id === 'system') continue;

    const transfers = u.transfers || [];
    let cleanedTransfers = [];
    
    // Group halftime subs by round and keep only the latest 3 per round with status: 'ACTIVE'
    const nonHalftimeSubs = transfers.filter(t => t.type !== 'HALFTIME_SUB');
    const halftimeSubs = transfers.filter(t => t.type === 'HALFTIME_SUB');

    const subsByRound = {};
    halftimeSubs.forEach(t => {
      const r = t.round || 1;
      if (!subsByRound[r]) subsByRound[r] = [];
      if (t.status !== 'CANCELLED') {
        subsByRound[r].push({ ...t, status: 'ACTIVE' });
      }
    });

    const activeHalftimeSubs = [];
    Object.keys(subsByRound).forEach(r => {
      // Keep only up to 3 latest active subs per round
      const roundSubs = subsByRound[r].slice(-3);
      activeHalftimeSubs.push(...roundSubs);
    });

    cleanedTransfers = [...nonHalftimeSubs, ...activeHalftimeSubs];

    await db.collection('users').doc(docSnap.id).update({
      transfers: cleanedTransfers
    });

    console.log(`✅ Team '${u.teamName || docSnap.id}': cleaned transfers count = ${cleanedTransfers.length}`);
  }

  console.log('\n🎉 ALL STALE TRANSFERS CLEANED UP IN FIRESTORE!');
}

cleanupStaleHalftimeSubs().catch(console.error);
