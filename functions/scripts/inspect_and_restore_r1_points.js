const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function inspectAndRestoreR1Points() {
  console.log('--- RESTORING ROUND 1 PLAYER POINTS FOR ALL TEAMS ---');

  // Load real_league_players_scoring map
  const scoringSnap = await db.collection('real_league_players_scoring').get();
  const playerScoresMap = new Map();

  const norm = s => String(s || '').toLowerCase().replace(/['"״׳.\-\s]/g, '');

  scoringSnap.forEach(doc => {
    const d = doc.data();
    if (d.name) {
      playerScoresMap.set(norm(d.name), Number(d.points) || 0);
    }
  });

  console.log(`Loaded ${playerScoresMap.size} player scores from real_league_players_scoring.`);

  const usersSnap = await db.collection('users').get();
  
  for (const docSnap of usersSnap.docs) {
    const u = docSnap.data();
    if (docSnap.id === 'admin' || docSnap.id === 'system') continue;

    console.log(`\nProcessing Team '${u.teamName || docSnap.id}'...`);
    const lByR = u.lineupsByRound || {};
    const r1Data = lByR[1] || {};
    let r1Lineup = r1Data.lineup || u.published_lineup || u.lineup || [];

    if (r1Lineup.length === 0 && u.squad && u.squad.length >= 11) {
      r1Lineup = u.squad.slice(0, 11);
    }

    let updatedLineup = r1Lineup.map(p => {
      const pNorm = norm(p.name);
      let pts = p.points;

      // Check if real_league_players_scoring has points for this player
      if (playerScoresMap.has(pNorm)) {
        pts = playerScoresMap.get(pNorm);
      }

      return {
        ...p,
        points: pts !== undefined ? Number(pts) : 0
      };
    });

    // Special hardcoded checks for known Round 1 scores if real_league_players_scoring is missing them
    if (docSnap.id === 'tumali') {
      // Tumali Round 1 lineup known scores: כץ (1), בטאיי (1), בן חמו (2), חזן (4), סוקלר (6), אוגריסה (7) = 20 pts
      updatedLineup = updatedLineup.map(p => {
        if (p.name.includes('כץ')) return { ...p, points: 1 };
        if (p.name.includes('בטאיי')) return { ...p, points: 1 };
        if (p.name.includes('בן חמו')) return { ...p, points: 2 };
        if (p.name.includes('חזן')) return { ...p, points: 4 };
        if (p.name.includes('סוקלר')) return { ...p, points: 6 };
        if (p.name.includes('אוגריסה')) return { ...p, points: 7 };
        return p;
      });
    }

    let totalR1Points = updatedLineup.reduce((sum, p) => sum + (Number(p.points) || 0), 0);
    console.log(`  Updated Round 1 Lineup (${updatedLineup.length} players): Total Points = ${totalR1Points}`);
    console.log('  Breakdown:', updatedLineup.map(p => `${p.name}: ${p.points}`).join(', '));

    await db.collection('users').doc(docSnap.id).set({
      lineupsByRound: {
        ...lByR,
        1: {
          ...r1Data,
          lineup: updatedLineup,
          totalPoints: totalR1Points
        }
      },
      published_lineup: updatedLineup,
      lineup: updatedLineup
    }, { merge: true });
  }

  console.log('\n✅ ALL TEAMS ROUND 1 POINTS RESTORED IN FIRESTORE!');
}

inspectAndRestoreR1Points().catch(console.error);
