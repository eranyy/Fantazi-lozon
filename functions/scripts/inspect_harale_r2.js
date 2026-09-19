const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function inspectHaraleR2() {
  const doc = await db.collection('users').doc('harale').get();
  const u = doc.data();
  console.log('--- HARALE (GUY) FIRESTORE DATA ---');
  console.log('lineup:', (u.lineup || []).map(p => `${p.name} (${p.team}, pts: ${p.points})`));
  console.log('published_lineup:', (u.published_lineup || []).map(p => `${p.name} (${p.team}, pts: ${p.points})`));
  console.log('lineupsByRound:', JSON.stringify(u.lineupsByRound, null, 2));
}

inspectHaraleR2().catch(console.error);
