const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function triggerGlobalRefresh() {
  console.log('=== TRIGGERING GLOBAL BROWSER REFRESH FOR ALL MANAGERS ===');
  await db.doc('system_settings/global_refresh').set({
    timestamp: Date.now(),
    message: 'LiveArena Matchday 2 scores updated and verified'
  }, { merge: true });
  console.log('Global refresh signal sent successfully!');
  process.exit(0);
}

triggerGlobalRefresh();
