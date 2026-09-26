const admin = require('firebase-admin');
if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'fantasy-luzon' });
}
const db = admin.firestore();

async function triggerGlobalRefresh() {
  const now = Date.now();
  console.log(`Sending global refresh trigger to all clients at timestamp ${now}...`);
  await db.collection('system_settings').doc('global_refresh').set({
    timestamp: now,
    reason: 'Round 6 lineup reset force refresh'
  }, { merge: true });
  console.log('✅ Global refresh trigger sent!');
  process.exit(0);
}

triggerGlobalRefresh().catch(err => {
  console.error(err);
  process.exit(1);
});
