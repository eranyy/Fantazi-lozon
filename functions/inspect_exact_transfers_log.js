const admin = require('firebase-admin');

if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function inspectExactTransfersLog() {
  console.log('--- INSPECTING EXACT TRANSFERS ARRAY FOR ALL TEAMS ---');
  const usersSnap = await db.collection('users').get();

  usersSnap.forEach(docSnap => {
    const u = docSnap.data();
    if (docSnap.id === 'admin' || docSnap.id === 'system') return;

    const transfers = u.transfers || [];
    console.log(`\nTeam '${u.teamName || docSnap.id}' (doc ID: ${docSnap.id}):`);
    transfers.forEach((t, i) => {
      console.log(`  ${i+1}. id: ${t.id} | type: ${t.type} | round: ${t.round} | out: ${t.playerOut} | in: ${t.playerIn} | status: ${t.status}`);
    });
  });
}

inspectExactTransfersLog().catch(console.error);
