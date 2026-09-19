const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function checkPlayerStructure() {
  const doc = await db.doc('users/hamsili').get();
  const u = doc.data();
  console.log('User keys:', Object.keys(u));
  if (u.squad && u.squad.length > 0) {
    console.log('Squad player sample:', JSON.stringify(u.squad[0], null, 2));
  }
  if (u.lineupsByRound && u.lineupsByRound['2']) {
    console.log('lineupsByRound[2] sample:', JSON.stringify(u.lineupsByRound['2'].lineup[0], null, 2));
  }
}

checkPlayerStructure().catch(console.error);
