const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function clearHamsiliLineup() {
  console.log('=== CLEARING HAMSILI LINEUP IN FIRESTORE ===');
  
  const hamsiliRef = db.collection('users').doc('hamsili');
  await hamsiliRef.set({
    lineup: [],
    published_lineup: [],
    'lineupsByRound.2': {
      lineup: [],
      subsOut: [],
      savedAt: new Date().toISOString()
    }
  }, { merge: true });

  console.log('Successfully cleared Hamsili lineup. The pitch is now completely empty!');
  process.exit(0);
}

clearHamsiliLineup();
