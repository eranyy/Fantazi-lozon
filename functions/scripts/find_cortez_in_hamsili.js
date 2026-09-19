const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function findCortezInHamsili() {
  const doc = await db.collection('users').doc('hamsili').get();
  const u = doc.data();
  console.log('--- ALL KEYS IN HAMSILI ---');
  Object.keys(u).forEach(k => {
    const val = JSON.stringify(u[k]);
    if (val.includes('קורטז') || val.includes('Cortez')) {
      console.log(`Key '${k}' CONTAINS CORTEZ!`);
      console.log(val);
    }
  });
}

findCortezInHamsili().catch(console.error);
