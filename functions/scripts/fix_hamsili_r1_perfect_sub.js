const admin = require('firebase-admin');

if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function fixHamsiliR1PerfectSub() {
  console.log('--- SETTING PERFECT ROUND 1 LINEUP AND HALFTIME SUBS FOR HAMSILI ---');

  const hamsiliRef = db.collection('users').doc('hamsili');
  const hamsiliSnap = await hamsiliRef.get();
  if (!hamsiliSnap.exists) return;

  const u = hamsiliSnap.data();
  const lByR = u.lineupsByRound || {};
  const r1Data = lByR[1] || {};

  // 1. Define starting lineup (exactly 11 players)
  const starting11 = [
    { name: 'מרציאנו', team: 'ב"ש', position: 'GK', points: 0, stats: { started: true } },
    { name: 'רביבו', team: 'מכבי ת"א', position: 'DEF', points: 10, stats: { started: true, played60: true, won: true } },
    { name: 'לינדוויק', team: 'מכבי חיפה', position: 'DEF', points: 1, stats: { started: true, played60: true } },
    { name: "צ'יקו", team: 'הפועל ת"א', position: 'DEF', points: 0, stats: { started: true } },
    { name: 'דרוויש', team: 'ק"ש', position: 'DEF', points: -1, stats: { started: true } },
    { name: 'עומר אצילי', team: 'מכבי חיפה', position: 'MID', points: 0, stats: { started: true } },
    { name: 'גורה', team: 'מכבי חיפה', position: 'MID', points: 4, stats: { started: true, played60: true } },
    { name: 'בילו', team: 'נתניה', position: 'MID', points: 2, stats: { started: true, played60: true } },
    { name: 'סאנייה', team: 'ק"ש', position: 'MID', points: 1, stats: { started: true, played60: true } },
    { name: "תורג'מן", team: 'הפועל חיפה', position: 'FWD', points: 0, stats: { started: true } },
    { name: 'וייסמן', team: 'בית"ר', position: 'FWD', points: 0, stats: { started: true } }
  ];

  // 2. Define bench (subsOut) with Cortez having 2 points
  const cortezBenchObj = {
    id: 'cortez_hamsili',
    name: 'קורטז',
    team: 'חמסילי',
    realTeam: 'חמסילי',
    position: 'FWD',
    pos: 'ATT',
    points: 2,
    stats: {
      played: true,
      sixtyMin: true,
      won: true
    }
  };

  const hugiBenchObj = {
    name: 'חוגי',
    team: 'הפועל ת"א',
    position: 'FWD',
    points: 0,
    stats: { played: true }
  };

  const existingSubsOut = (r1Data.subsOut || []).filter(p => p.name !== 'קורטז' && p.name !== 'חוגי');
  const cleanSubsOut = [cortezBenchObj, hugiBenchObj, ...existingSubsOut];

  // 3. Ensure transfers has HALFTIME_SUB entries for Round 1
  let transfers = u.transfers || [];
  
  // Clean up any existing HALFTIME_SUB for round 1
  transfers = transfers.filter(t => !(t.type === 'HALFTIME_SUB' && t.round === 1));

  const sub1 = {
    id: 'sub_r1_darrwish_hugi',
    type: 'HALFTIME_SUB',
    round: 1,
    playerOut: 'דרוויש',
    playerIn: 'חוגי',
    actionBy: 'ערן',
    timestamp: '2026-08-22T19:00:00.000Z'
  };

  const sub2 = {
    id: 'sub_r1_sania_cortez',
    type: 'HALFTIME_SUB',
    round: 1,
    playerOut: 'סאנייה',
    playerIn: 'קורטז',
    actionBy: 'ערן',
    timestamp: '2026-08-22T19:01:00.000Z'
  };

  transfers.push(sub1, sub2);

  // 4. Save to Firestore
  await hamsiliRef.set({
    lineupsByRound: {
      ...lByR,
      1: {
        ...r1Data,
        lineup: starting11,
        subsOut: cleanSubsOut
      }
    },
    transfers
  }, { merge: true });

  console.log('✅ Hamsili Round 1 lineup fixed: 11 starters, Cortez on bench with 2 pts, halftime sub: סאנייה ➔ קורטז (2 נק)!');
}

fixHamsiliR1PerfectSub().catch(console.error);
