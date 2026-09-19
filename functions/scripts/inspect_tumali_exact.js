const admin = require('firebase-admin');

if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function inspectTumaliExact() {
  const doc = await db.collection('users').doc('tumali').get();
  const u = doc.data();
  const r1 = u.lineupsByRound?.[1] || {};
  console.log('--- TUMALI LINEUPS BY ROUND 1 ---');
  console.log('totalPoints field:', r1.totalPoints);
  console.log('lineup:', (r1.lineup || []).map(p => `${p.name}: ${p.points}`));
}

inspectTumaliExact().catch(console.error);
