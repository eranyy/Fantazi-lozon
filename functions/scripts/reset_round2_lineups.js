const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function resetRound2Lineups() {
  console.log('=== RESETTING ROUND 2 LINEUPS & STATS IN FIRESTORE ===');
  const usersSnap = await db.collection('users').get();
  const batch = db.batch();

  usersSnap.docs.forEach(uDoc => {
    const u = uDoc.data();
    if (u.teamName === 'ADMIN' || u.name === 'ADMIN') return;

    const currentLineup = u.published_lineup || u.lineup || [];
    
    // Create clean starting lineup for Round 2 with 0 points and empty stats
    const cleanRound2Lineup = currentLineup.map((p) => ({
      ...p,
      points: 0,
      stats: {}
    }));

    const lineupsByRound = u.lineupsByRound || {};
    lineupsByRound[2] = {
      round: 2,
      lineup: cleanRound2Lineup,
      subsOut: (u.published_subs_out || u.bench || []).map((p) => ({ ...p, points: 0, stats: {} })),
      updatedAt: new Date().toISOString()
    };

    batch.set(uDoc.ref, {
      lineupsByRound,
      // Reset current active lineup stats for Round 2
      lineup: cleanRound2Lineup,
      published_lineup: cleanRound2Lineup
    }, { merge: true });

    console.log(`Reset Round 2 for team: ${u.teamName || u.name}`);
  });

  await batch.commit();
  console.log('Successfully reset all teams to 0 points for Round 2!');
  process.exit(0);
}

resetRound2Lineups();
