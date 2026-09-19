const admin = require('firebase-admin');

if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function fixOwusuAndCortezData() {
  console.log('--- FIXING OWUSU & CORTEZ FIRESTORE DATA ---');

  // 1. Fix Tampa's Owusu (הפועל ת"א) in Round 1: set points to 0
  const tampaRef = db.collection('users').doc('tampa');
  const tampaSnap = await tampaRef.get();
  if (tampaSnap.exists) {
    const tData = tampaSnap.data();
    const lByR = tData.lineupsByRound || {};
    if (lByR[1] && Array.isArray(lByR[1].lineup)) {
      const fixedR1Lineup = lByR[1].lineup.map((p) => {
        if (p.name && p.name.includes('אווסו') && (p.team?.includes('הפועל') || p.realTeam?.includes('הפועל'))) {
          console.log('Fixing Tampa Round 1 Owusu (הפועל ת"א) points from', p.points, 'to 0');
          return { ...p, points: 0, stats: { ...(p.stats || {}), played: false, sixtyMin: false } };
        }
        return p;
      });
      await tampaRef.set({
        lineupsByRound: {
          ...lByR,
          1: { ...lByR[1], lineup: fixedR1Lineup }
        }
      }, { merge: true });
      console.log('✅ Tampa Round 1 Owusu fixed!');
    }
  }

  // 2. Ensure Cortez exists in real_league_players_scoring & players DB so he is always selectable
  const cortezScoringRef = db.collection('real_league_players_scoring').doc('קורטז');
  await cortezScoringRef.set({
    name: 'קורטז',
    team: 'חמסילי',
    realTeam: 'חמסילי',
    fantasyTeamName: 'חמסילי',
    position: 'FWD',
    points: 0,
    goals: 0,
    assists: 0
  }, { merge: true });
  console.log('✅ Cortez added/updated in real_league_players_scoring!');

  // Also add Cortez to players collection if missing
  const cortezPlayerRef = db.collection('players').doc('cortez_hamsili');
  await cortezPlayerRef.set({
    id: 'cortez_hamsili',
    name: 'קורטז',
    team: 'חמסילי',
    realTeam: 'חמסילי',
    position: 'FWD',
    points: 0
  }, { merge: true });
  console.log('✅ Cortez added/updated in players collection!');
}

fixOwusuAndCortezData().catch(console.error);
