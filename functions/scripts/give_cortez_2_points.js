const admin = require('firebase-admin');

if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function giveCortez2Points() {
  console.log('--- GIVING CORTEZ 2 POINTS FOR ROUND 1 ---');

  const usersSnap = await db.collection('users').get();
  let found = false;

  for (const docSnap of usersSnap.docs) {
    const u = docSnap.data();
    if (docSnap.id === 'admin' || docSnap.id === 'system') continue;

    const lByR = u.lineupsByRound || {};
    if (lByR[1] && Array.isArray(lByR[1].lineup)) {
      let updated = false;
      const fixedLineup = lByR[1].lineup.map(p => {
        if (p.name && (p.name.includes('קורטז') || p.name.includes('Cortez'))) {
          console.log(`Found Cortez in team '${u.teamName || docSnap.id}' for Round 1! Updating points to 2...`);
          updated = true;
          found = true;
          return {
            ...p,
            points: 2,
            stats: {
              ...(p.stats || {}),
              played: true,
              sixtyMin: true
            }
          };
        }
        return p;
      });

      if (updated) {
        await db.collection('users').doc(docSnap.id).set({
          lineupsByRound: {
            ...lByR,
            1: {
              ...lByR[1],
              lineup: fixedLineup
            }
          }
        }, { merge: true });
        console.log(`✅ Successfully updated Cortez points to 2 in user doc '${docSnap.id}'!`);
      }
    }
  }

  if (!found) {
    console.log('Cortez was not found in any team Round 1 lineup. Searching squad or published_lineup...');
    for (const docSnap of usersSnap.docs) {
      const u = docSnap.data();
      const squad = u.squad || [];
      const pLineup = u.published_lineup || [];
      const hasCortez = [...squad, ...pLineup].some(p => p.name && (p.name.includes('קורטז') || p.name.includes('Cortez')));
      if (hasCortez) {
        console.log(`Found Cortez in current squad/published_lineup of user '${u.teamName || docSnap.id}'!`);
        const lByR = u.lineupsByRound || {};
        const r1Data = lByR[1] || { lineup: [] };
        const cortezObj = { name: 'קורטז', team: 'חמסילי', position: 'FWD', points: 2, stats: { played: true, sixtyMin: true } };
        const newR1Lineup = [...r1Data.lineup, cortezObj];

        await db.collection('users').doc(docSnap.id).set({
          lineupsByRound: {
            ...lByR,
            1: {
              ...r1Data,
              lineup: newR1Lineup
            }
          }
        }, { merge: true });
        console.log(`✅ Added Cortez with 2 points to Round 1 lineup of '${docSnap.id}'!`);
        found = true;
      }
    }
  }

  // Also update real_league_players_scoring doc for Cortez
  await db.collection('real_league_players_scoring').doc('קורטז').set({
    name: 'קורטז',
    points: 2,
    team: 'חמסילי',
    fantasyTeamName: 'חמסילי'
  }, { merge: true });
  console.log('✅ Updated real_league_players_scoring doc [קורטז] to 2 points!');
}

giveCortez2Points().catch(console.error);
