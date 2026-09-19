const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function checkAllLineups() {
  console.log('=== CHECKING ALL FANTASY TEAMS LINEUPS ===');
  const snap = await db.collection('users').get();
  
  snap.docs.forEach(doc => {
    const u = doc.data();
    if (u.teamName === 'ADMIN' || u.name === 'ADMIN') return;
    console.log(`\nTeam: ${u.teamName || doc.id} (${u.manager || ''})`);
    console.log(`  Starting Lineup count: ${(u.lineup || []).length}`);
    console.log(`  Squad total count: ${(u.squad || []).length}`);
    console.log('  Starting players:', (u.lineup || []).map(p => p.name).join(', '));
  });

  process.exit(0);
}

checkAllLineups();
