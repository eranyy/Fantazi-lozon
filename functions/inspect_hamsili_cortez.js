const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function inspectHamsiliCortez() {
  const doc = await db.collection('users').doc('hamsili').get();
  const u = doc.data();
  console.log('Hamsili keys:', Object.keys(u));
  console.log('Hamsili squad:', u.squad);
  console.log('Hamsili published_lineup:', u.published_lineup);
  console.log('Hamsili lineupsByRound:', JSON.stringify(u.lineupsByRound, null, 2));
}

inspectHamsiliCortez().catch(console.error);
