const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function findSagna() {
  const snap = await db.collection('real_league_players_scoring').get();
  console.log(`Total real players in collection: ${snap.size}`);
  snap.docs.forEach(doc => {
    const data = doc.data();
    const name = data.name || '';
    if (name.includes('אמ') || name.includes('סנ') || name.includes('סני') || name.includes('אסנ') || name.includes('סאנ')) {
      console.log(`Found doc "${doc.id}": "${name}" (${data.realTeam || data.team}) - Drafted: ${data.isDrafted} | Owner: ${data.ownerTeam}`);
    }
  });

  // Also check all 6 users' squads for any player named Sagna / Amadou / Assania / Sanya
  const usersSnap = await db.collection('users').get();
  usersSnap.docs.forEach(doc => {
    const u = doc.data();
    const squad = u.squad || [];
    squad.forEach(pl => {
      if ((pl.name || '').includes('סנ') || (pl.name || '').includes('אמ') || (pl.name || '').includes('סני') || (pl.name || '').includes('אסנ')) {
        console.log(`Squad player in ${u.teamName} (${u.manager}): "${pl.name}" (${pl.realTeam || pl.team})`);
      }
    });
  });

  process.exit(0);
}

findSagna();
