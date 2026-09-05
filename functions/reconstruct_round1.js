const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function reconstructRound1() {
  const usersSnap = await db.collection('users').get();
  
  for (const doc of usersSnap.docs) {
    const user = doc.data();
    if (doc.id === 'admin' || doc.id === 'system') continue;

    console.log(`\n========================================`);
    console.log(`TEAM: ${doc.id} (${user.teamName})`);
    
    const transfers = user.transfers || [];
    const r1Transfers = transfers.filter(t => t.round === 1);
    
    // Find last REGULAR_EDIT or LATE_REGULAR_EDIT for round 1
    const editLogs = r1Transfers.filter(t => t.type === 'REGULAR_EDIT' || t.type === 'LATE_REGULAR_EDIT');
    console.log(`Round 1 Edit Logs:`, editLogs.map(e => e.playersIn));

    // Find VAR_POINTS_UPDATE for round 1
    const varLogs = r1Transfers.filter(t => t.type === 'VAR_POINTS_UPDATE');
    console.log(`Round 1 VAR Points Updates:`);
    varLogs.forEach(v => console.log(`  ${v.playerIn}: ${v.playerOut}`));

    // Find HALFTIME_SUB for round 1
    const subLogs = r1Transfers.filter(t => t.type === 'HALFTIME_SUB' && t.status !== 'CANCELLED');
    console.log(`Round 1 Halftime Subs:`, subLogs.map(s => `${s.playerOut} -> ${s.playerIn}`));
  }
}

reconstructRound1().catch(console.error);
