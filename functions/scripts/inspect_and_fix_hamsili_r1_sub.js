const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function inspectAndFixHamsiliR1Sub() {
  const doc = await db.collection('users').doc('hamsili').get();
  const u = doc.data();
  const r1 = u.lineupsByRound?.[1] || {};

  console.log('--- HAMSILI ROUND 1 BEFORE ---');
  console.log('lineup:', (r1.lineup || []).map(p => `${p.name} (${p.points})`));
  console.log('subsOut:', (r1.subsOut || []).map(p => `${p.name} (${p.points})`));
  console.log('roundSubs / halftime subs:', r1.roundSubs || r1.substitutions || r1.transfers);
}

inspectAndFixHamsiliR1Sub().catch(console.error);
