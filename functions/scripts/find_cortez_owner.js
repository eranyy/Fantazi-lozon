const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function findCortezOwner() {
  console.log('--- SEARCHING ALL USER DOCUMENTS FOR CORTEZ ---');
  const usersSnap = await db.collection('users').get();
  usersSnap.forEach(doc => {
    const u = doc.data();
    const str = JSON.stringify(u);
    if (str.includes('קורטז') || str.includes('Cortez')) {
      console.log(`FOUND CORTEZ in user doc ID: '${doc.id}' (teamName: '${u.teamName}')!`);
    } else {
      console.log(`User '${doc.id}' (${u.teamName || u.name})`);
    }
  });
}

findCortezOwner().catch(console.error);
