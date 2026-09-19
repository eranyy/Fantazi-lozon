const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function preserveAndInitializeRound3() {
  console.log('=== STEP 1: PRESERVING ROUND 1 AND ROUND 2 IN FIRESTORE ===\n');

  const usersSnap = await db.collection('users').get();
  const fixturesSnap = await db.doc('leagueData/fixtures').get();
  const settingsSnap = await db.doc('leagueData/settings').get();

  const usersBackup = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const fixturesData = fixturesSnap.exists ? fixturesSnap.data().rounds : [];

  // 1. Create permanent backup docs for Round 1 and Round 2 in round_backups collection
  await db.doc('round_backups/backup_round_1').set({
    round: 1,
    timestamp: new Date().toISOString(),
    teamsSnapshot: usersBackup,
    fixturesSnapshot: fixturesData
  }, { merge: true });

  await db.doc('round_backups/backup_round_2').set({
    round: 2,
    timestamp: new Date().toISOString(),
    teamsSnapshot: usersBackup,
    fixturesSnapshot: fixturesData
  }, { merge: true });

  console.log('✅ Permanent backups created for Round 1 & Round 2 in round_backups collection!');

  // 2. Ensure each user doc has lineupsByRound[1] and lineupsByRound[2] fully populated and locked
  for (const doc of usersSnap.docs) {
    if (doc.id === 'admin' || doc.id === 'system') continue;
    const u = doc.data();

    const currentLineupsByRound = u.lineupsByRound || {};

    const r1Lineup = currentLineupsByRound[1]?.lineup || currentLineupsByRound['1']?.lineup || u.published_lineup || u.lineup || [];
    const r2Lineup = currentLineupsByRound[2]?.lineup || currentLineupsByRound['2']?.lineup || u.published_lineup || u.lineup || [];

    // Reset stats & points for Round 3 active published_lineup
    const emptyStats = { started: false, played60: false, notInSquad: false, won: false, goals: 0, assists: 0, cleanSheet: false, conceded: 0, yellow: false, secondYellow: false, red: false, penaltyWon: 0, penaltyMissed: 0, penaltySaved: 0, ownGoals: 0, assistOwnGoal: 0 };

    const resetLineupForRound3 = (u.published_lineup || u.lineup || u.squad || []).map((pl) => ({
      ...pl,
      points: 0,
      stats: emptyStats
    }));

    await doc.ref.set({
      published_lineup: resetLineupForRound3,
      lineup: resetLineupForRound3,
      lineupsByRound: {
        ...currentLineupsByRound,
        1: {
          round: 1,
          lineup: r1Lineup
        },
        2: {
          round: 2,
          lineup: r2Lineup
        },
        3: {
          round: 3,
          lineup: resetLineupForRound3
        }
      }
    }, { merge: true });

    console.log(`✅ Preserved team "${u.teamName || doc.id}" R1 & R2 lineups and initialized clean Round 3 lineup (0 pts)!`);
  }

  // 3. Update settings to currentRound: 3
  await db.doc('leagueData/settings').set({
    currentRound: 3
  }, { merge: true });

  console.log('\n✅ Settings updated to currentRound: 3!');
  process.exit(0);
}

preserveAndInitializeRound3();
