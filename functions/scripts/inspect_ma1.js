const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function checkMatchdayArchiveR1() {
  const snap = await db.collection('matchday_archive').where('round', '==', 1).get();
  console.log(`Found ${snap.size} docs in matchday_archive for round 1:`);
  snap.forEach(d => {
    console.log(`Doc ID: ${d.id}`);
    console.log(JSON.stringify(d.data(), null, 2));
  });
}

checkMatchdayArchiveR1().catch(console.error);
