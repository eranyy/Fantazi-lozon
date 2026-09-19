const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function syncKanaanNow() {
  console.log('=== SYNCING KANA\'AN IN LINEUPSBYROUND[2] FOR PICHICHI ===\n');

  const pichichiRef = db.collection('users').doc('pichichi');
  const snap = await pichichiRef.get();
  if (snap.exists) {
    const data = snap.data();
    const sourceLineup = data.published_lineup || data.lineup || [];
    const r2Lineup = data.lineupsByRound && data.lineupsByRound[2] ? data.lineupsByRound[2].lineup || [] : [];

    const updatedR2Lineup = r2Lineup.map(p => {
      if (p.name.includes('כנעאן') || p.name.includes('כנען')) {
        const sourceP = sourceLineup.find(sp => sp.name.includes('כנעאן') || sp.name.includes('כנען'));
        if (sourceP) {
          console.log(`Syncing Kanaan in R2 lineup: pts=${sourceP.points}`, sourceP.stats);
          return {
            ...p,
            points: sourceP.points || 1,
            stats: { ...(sourceP.stats || {}), started: true, played60: false }
          };
        }
      }
      return p;
    });

    await pichichiRef.set({
      lineupsByRound: {
        ...(data.lineupsByRound || {}),
        2: {
          ...(data.lineupsByRound?.[2] || {}),
          lineup: updatedR2Lineup
        }
      }
    }, { merge: true });

    console.log('✅ Kanaan updated in lineupsByRound[2] for Pichichi!');
  }

  process.exit(0);
}

syncKanaanNow();
