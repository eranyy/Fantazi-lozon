const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function clearPendingEvents() {
  console.log('=== CLEARING STALE PENDING EVENTS ===\n');

  const pendingSnap = await db.collection('live_pending_events').get();
  console.log(`Found ${pendingSnap.size} pending events. Deleting...`);

  const batch = db.batch();
  pendingSnap.docs.forEach(doc => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  console.log('✅ Cleared all stale pending events! The live scraper will now broadcast fresh live events directly to WhatsApp.');
  process.exit(0);
}

clearPendingEvents();
