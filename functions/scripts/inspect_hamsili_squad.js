const admin = require('firebase-admin');

if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function inspectHamsiliSquad() {
  const doc = await db.collection('users').doc('hamsili').get();
  const u = doc.data();
  console.log('--- HAMSILI FIRESTORE DATA ---');
  console.log('squad count:', (u.squad || []).length);
  console.log('squad names:', (u.squad || []).map(p => `"${p.name}" (${p.team})`));
  console.log('players count:', (u.players || []).length);
  console.log('players names:', (u.players || []).map(p => `"${p.name}" (${p.team})`));
}

inspectHamsiliSquad().catch(console.error);
