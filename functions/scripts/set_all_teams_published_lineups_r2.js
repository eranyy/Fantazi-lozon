const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function syncAllPublished() {
  console.log('=== SYNCHRONIZING PUBLISHED LINEUPS AND LINEUPS BY ROUND 2 ===\n');

  const usersSnap = await db.collection('users').get();
  for (const doc of usersSnap.docs) {
    const u = doc.data();
    if (doc.id === 'admin' || doc.id === 'system') continue;

    const r2Lineup = u.lineupsByRound?.[2]?.lineup || u.published_lineup || u.lineup || [];
    if (r2Lineup.length > 0) {
      await doc.ref.set({
        published_lineup: r2Lineup,
        lineup: r2Lineup,
        lineupsByRound: {
          ...(u.lineupsByRound || {}),
          2: {
            round: 2,
            lineup: r2Lineup
          }
        }
      }, { merge: true });

      const total = r2Lineup.reduce((sum, pl) => sum + (Number(pl.points) || 0), 0);
      console.log(`✅ Synced team "${u.teamName || doc.id}" -> Total Points: ${total}`);
    }
  }

  console.log('\n✅ All teams synchronized in Firestore!');
  process.exit(0);
}

syncAllPublished();
