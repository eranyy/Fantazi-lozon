const admin = require('firebase-admin');

if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function inspectAllTeamSubs() {
  console.log('--- INSPECTING TRANSFERS / HALFTIME SUBS FOR ALL TEAMS ---');
  const usersSnap = await db.collection('users').get();

  usersSnap.forEach(docSnap => {
    const u = docSnap.data();
    if (docSnap.id === 'admin' || docSnap.id === 'system') return;

    const transfers = u.transfers || [];
    const r1Subs = transfers.filter(t => t.type === 'HALFTIME_SUB' && t.round === 1 && t.status !== 'CANCELLED');
    const r2Subs = transfers.filter(t => t.type === 'HALFTIME_SUB' && t.round === 2 && t.status !== 'CANCELLED');

    console.log(`\nTeam '${u.teamName || docSnap.id}' (doc ID: ${docSnap.id}):`);
    console.log(`  Round 1 Halftime Subs (${r1Subs.length}):`, r1Subs.map(s => `${s.playerOut} ➔ ${s.playerIn}`));
    console.log(`  Round 2 Halftime Subs (${r2Subs.length}):`, r2Subs.map(s => `${s.playerOut} ➔ ${s.playerIn}`));
    console.log('  Lineup count:', (u.lineup || []).length);
    console.log('  Published Lineup count:', (u.published_lineup || []).length);
  });
}

inspectAllTeamSubs().catch(console.error);
