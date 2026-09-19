const admin = require('firebase-admin');

if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function addCortezToHamsiliR1() {
  console.log('--- ADDING CORTEZ WITH 2 POINTS TO HAMSILI ROUND 1 ---');

  const hamsiliRef = db.collection('users').doc('hamsili');
  const hamsiliSnap = await hamsiliRef.get();
  if (!hamsiliSnap.exists) {
    console.error('Hamsili document not found!');
    return;
  }

  const hData = hamsiliSnap.data();
  const lByR = hData.lineupsByRound || {};
  const r1Data = lByR[1] || { lineup: [], subsOut: [] };

  const cortezObj = {
    id: 'cortez_hamsili',
    name: 'קורטז',
    team: 'חמסילי',
    realTeam: 'חמסילי',
    position: 'FWD',
    pos: 'ATT',
    points: 2,
    isStarting: true,
    stats: {
      played: true,
      sixtyMin: true,
      won: true,
      started: true,
      goals: 0,
      assists: 0
    }
  };

  let lineup = r1Data.lineup || [];
  let subsOut = r1Data.subsOut || [];

  // Check if Cortez is already in lineup or subsOut
  let inLineupIdx = lineup.findIndex(p => p.name && (p.name.includes('קורטז') || p.name.includes('Cortez')));
  let inSubsIdx = subsOut.findIndex(p => p.name && (p.name.includes('קורטז') || p.name.includes('Cortez')));

  if (inLineupIdx !== -1) {
    lineup[inLineupIdx] = { ...lineup[inLineupIdx], ...cortezObj };
    console.log('Updated existing Cortez in Round 1 starting lineup!');
  } else if (inSubsIdx !== -1) {
    subsOut[inSubsIdx] = { ...subsOut[inSubsIdx], ...cortezObj };
    console.log('Updated existing Cortez in Round 1 subsOut bench!');
  } else {
    // Add Cortez to lineup
    lineup.push(cortezObj);
    console.log('Added Cortez as 12th player/member to Round 1 starting lineup!');
  }

  // Recalculate Round 1 total points for hamsili
  const r1TotalPoints = lineup.reduce((sum, p) => sum + (Number(p.points) || 0), 0);

  await hamsiliRef.set({
    lineupsByRound: {
      ...lByR,
      1: {
        ...r1Data,
        lineup,
        subsOut,
        totalPoints: r1TotalPoints
      }
    }
  }, { merge: true });

  console.log(`✅ Cortez successfully updated with 2 points in hamsili Round 1! Round 1 Total Points: ${r1TotalPoints}`);
}

addCortezToHamsiliR1().catch(console.error);
