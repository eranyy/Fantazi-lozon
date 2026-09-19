const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function listCollections() {
  const collections = await db.listCollections();
  console.log('Collections in Firestore:');
  for (const col of collections) {
    console.log(` - ${col.id}`);
  }
}

listCollections().catch(console.error);
