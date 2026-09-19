const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function triggerGlobalRefresh() {
  console.log('Sending global refresh signal to connected clients...');
  await db.doc('system_settings/global_refresh').set({
    timestamp: Date.now(),
    triggeredBy: 'ערן'
  }, { merge: true });
  console.log('✅ Global refresh signal sent to Firestore!');
}

triggerGlobalRefresh().catch(console.error);
