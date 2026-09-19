const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function searchAllCollectionsForPolls() {
  console.log('--- LISTING ALL FIRESTORE COLLECTIONS ---');
  const collections = await db.listCollections();
  for (const col of collections) {
    console.log(`Collection: ${col.id}`);
    const snap = await col.get();
    console.log(`  -> ${snap.size} documents`);
    if (col.id.includes('poll') || col.id.includes('predict') || col.id.includes('vote')) {
      snap.forEach(d => console.log('   Doc:', d.id, JSON.stringify(d.data()).slice(0, 150)));
    }
  }
}

searchAllCollectionsForPolls().catch(console.error);
