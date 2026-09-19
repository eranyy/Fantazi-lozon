const admin = require('firebase-admin');

if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function fixTumaliR1PerfectSub() {
  console.log('--- FIXING TUMALI ROUND 1 LINEUP AND HALFTIME SUBS ---');

  const tumaliRef = db.collection('users').doc('tumali');
  const tumaliSnap = await tumaliRef.get();
  if (!tumaliSnap.exists) return;

  const u = tumaliSnap.data();
  const lByR = u.lineupsByRound || {};
  const r1Data = lByR[1] || {};

  // 1. Starting 11 before subs (including Ben Hamo בן חמו)
  const starting11 = [
    { name: 'כץ', team: 'הפועל פ"ת', position: 'GK', points: 1, stats: { started: true } },
    { name: 'מאיימבו', team: 'הפועל ת"א', position: 'DEF', points: 0, stats: { started: true } },
    { name: 'איתי רוטמן', team: 'ב"ש', position: 'DEF', points: 0, stats: { started: true } },
    { name: 'לייבו', team: 'ק"ש', position: 'DEF', points: -1, stats: { started: true } },
    { name: 'בטאיי', team: 'מכבי חיפה', position: 'MID', points: 1, stats: { started: true } },
    { name: 'בן חמו', team: 'מכבי ת"א', position: 'MID', points: 2, stats: { started: true } },
    { name: 'חזן', team: 'מכבי פ"ת', position: 'MID', points: 4, stats: { started: true, goals: 0 } },
    { name: 'טוריאל', team: 'הפועל ת"א', position: 'MID', points: 0, stats: { started: true } },
    { name: 'יהושע', team: 'ב"ש', position: 'MID', points: 0, stats: { started: true } },
    { name: 'סוקלר', team: 'מכבי ת"א', position: 'FWD', points: 6, stats: { started: true, goals: 1 } },
    { name: 'אוגריסה', team: 'ק"ש', position: 'FWD', points: 7, stats: { started: true, goals: 1 } }
  ];

  // 2. Bench (subsOut) including incoming sub players
  const abuhatzira = { name: 'אבוחצירה', team: 'ק"ש', position: 'DEF', points: 0 };
  const yossefi = { name: 'יוספי', team: 'הפועל חיפה', position: 'MID', points: 0 };
  
  const existingSubsOut = (r1Data.subsOut || []).filter(p => p.name !== 'אבוחצירה' && p.name !== 'יוספי');
  const cleanSubsOut = [abuhatzira, yossefi, ...existingSubsOut];

  // 3. Halftime subs for Tumali Round 1
  let transfers = u.transfers || [];
  transfers = transfers.filter(t => !(t.type === 'HALFTIME_SUB' && t.round === 1));

  const sub1 = {
    id: 'sub_r1_leibo_abuhatzira',
    type: 'HALFTIME_SUB',
    round: 1,
    playerOut: 'לייבו',
    playerIn: 'אבוחצירה',
    actionBy: 'מנהל',
    timestamp: '2026-08-22T19:00:00.000Z'
  };

  const sub2 = {
    id: 'sub_r1_bataye_yossefi',
    type: 'HALFTIME_SUB',
    round: 1,
    playerOut: 'בטאיי',
    playerIn: 'יוספי',
    actionBy: 'מנהל',
    timestamp: '2026-08-22T19:01:00.000Z'
  };

  transfers.push(sub1, sub2);

  await tumaliRef.set({
    lineupsByRound: {
      ...lByR,
      1: {
        ...r1Data,
        lineup: starting11,
        subsOut: cleanSubsOut,
        totalPoints: 20
      }
    },
    transfers
  }, { merge: true });

  console.log('✅ Tumali Round 1 fixed: Ben Hamo preserved, Leibo subbed out for Abuhatzira, Bataye subbed out for Yossefi, Total Points = 20!');
}

fixTumaliR1PerfectSub().catch(console.error);
