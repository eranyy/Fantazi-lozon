const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function debugSquad() {
  const snap1 = await db.collection('users').doc('harale').get();
  console.log('=== HARALE SQUAD ===');
  (snap1.data().squad || []).forEach(p => console.log(`  name: "${p.name}", points: ${p.points}`));

  const snap2 = await db.collection('users').doc('holonia').get();
  console.log('=== HOLONIA SQUAD ===');
  (snap2.data().squad || []).forEach(p => console.log(`  name: "${p.name}", points: ${p.points}`));
}

debugSquad().then(() => process.exit(0));
