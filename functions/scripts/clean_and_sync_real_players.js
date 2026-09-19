const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function cleanAndSyncRealPlayers() {
  console.log('=== WIPING DUMMY/OUTDATED DATA FROM real_league_players_scoring ===');

  // 1. Delete all existing dummy/unverified documents in real_league_players_scoring
  const snap = await db.collection('real_league_players_scoring').get();
  const deleteBatch = db.batch();
  snap.docs.forEach(doc => {
    deleteBatch.delete(doc.ref);
  });
  await deleteBatch.commit();
  console.log(`Deleted ${snap.size} unverified/dummy documents.`);

  // 2. Fetch all verified users & their squads from Firestore
  const usersSnap = await db.collection('users').get();
  const realPlayersMap = new Map();

  usersSnap.docs.forEach(uDoc => {
    const u = uDoc.data();
    if (u.teamName === 'ADMIN' || u.name === 'ADMIN') return;

    const squad = u.published_lineup || u.lineup || u.squad || [];
    if (Array.isArray(squad)) {
      squad.forEach((pl) => {
        if (!pl.name) return;
        const normKey = String(pl.name).trim().toLowerCase().replace(/['"״׳`\-\s()]/g, '');

        // Calculate verified stats directly from actual events/points in lineup
        const pts = Number(pl.points) || 0;
        const stats = pl.stats || {};
        const goals = Number(stats.goals) || 0;
        const assists = Number(stats.assists) || 0;
        const yellowCards = Number(stats.yellowCards || stats.yellow) || 0;
        const redCards = Number(stats.redCards || stats.red) || 0;

        realPlayersMap.set(normKey, {
          id: pl.id || normKey,
          name: pl.name,
          realTeam: pl.realTeam || pl.team || 'ליגת WINNER',
          position: pl.position || 'MID',
          points: pts,
          goals: goals,
          assists: assists,
          yellowCards: yellowCards,
          redCards: redCards,
          isDrafted: true,
          ownerTeam: u.teamName || u.name || 'קבוצת פנטזי',
          ownerManager: u.manager || u.assistantName || '',
          updatedAt: new Date().toISOString()
        });
      });
    }
  });

  // 3. Save verified active players to real_league_players_scoring
  const saveBatch = db.batch();
  realPlayersMap.forEach((playerObj, key) => {
    const ref = db.collection('real_league_players_scoring').doc(key);
    saveBatch.set(ref, playerObj);
  });

  await saveBatch.commit();
  console.log(`Successfully saved ${realPlayersMap.size} verified active players!`);
  process.exit(0);
}

cleanAndSyncRealPlayers();
