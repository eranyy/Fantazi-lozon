const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function syncLineupsByRound() {
  console.log('=== SYNCING LINEUPSBYROUND[2] WITH LATEST PLAYER STATS IN FIRESTORE ===\n');

  const usersSnap = await db.collection('users').get();
  for (const doc of usersSnap.docs) {
    const u = doc.data();
    if (u.teamName && doc.id !== 'admin' && doc.id !== 'system') {
      const sourceLineup = u.published_lineup || u.lineup || [];
      const squad = u.squad || [];

      if (sourceLineup.length > 0) {
        // Map over lineupsByRound[2] if it exists, or create from sourceLineup
        const currentR2 = u.lineupsByRound && u.lineupsByRound[2] ? u.lineupsByRound[2] : { lineup: sourceLineup, subsOut: squad.slice(11) };
        const r2Lineup = currentR2.lineup || sourceLineup;

        const updatedR2Lineup = r2Lineup.map((pl) => {
          const matchInSource = sourceLineup.find(p => p.id === pl.id || p.name === pl.name) || squad.find(p => p.id === pl.id || p.name === pl.name);
          if (matchInSource && matchInSource.stats) {
            return {
              ...pl,
              points: matchInSource.points || pl.points || 0,
              stats: { ...matchInSource.stats }
            };
          }
          return pl;
        });

        const updatedLineupsByRound = {
          ...(u.lineupsByRound || {}),
          2: {
            ...currentR2,
            lineup: updatedR2Lineup
          }
        };

        await db.collection('users').doc(doc.id).set({
          lineupsByRound: updatedLineupsByRound
        }, { merge: true });

        console.log(`✅ Synced lineupsByRound[2] for team: ${u.teamName} (${doc.id})`);
      }
    }
  }

  process.exit(0);
}

syncLineupsByRound();
