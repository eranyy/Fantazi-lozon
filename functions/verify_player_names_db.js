const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function checkPlayerNames() {
  console.log('=== SEARCHING PLAYERS IN DB FOR BEN DAVID & SAGNA/ASSANIA ===');

  const snap = await db.collection('real_league_players_scoring').get();
  snap.docs.forEach(doc => {
    const data = doc.data();
    const name = data.name || '';
    if (name.includes('בן דוד') || name.includes('אסנ') || name.includes('אסנ')) {
      console.log(`Doc ID: "${doc.id}" | Name: "${data.name}" | Real Team: "${data.realTeam || data.team}" | Owner: "${data.ownerTeam}"`);
    }
  });

  // Also check all users' squads in Firestore
  console.log('\n=== CHECKING ALL USERS SQUADS ===');
  const usersSnap = await db.collection('users').get();
  usersSnap.docs.forEach(doc => {
    const u = doc.data();
    const squad = u.squad || [];
    squad.forEach((pl) => {
      if ((pl.name || '').includes('בן דוד') || (pl.name || '').includes('אסנ')) {
        console.log(`User: ${doc.id} (${u.teamName}) -> Player: "${pl.name}" | RealTeam: "${pl.realTeam || pl.team}"`);
      }
    });
  });

  process.exit(0);
}

checkPlayerNames();
