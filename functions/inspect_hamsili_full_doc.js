const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function inspectHamsiliDoc() {
  const doc = await db.collection('users').doc('hamsili').get();
  if (doc.exists) {
    const data = doc.data();
    console.log('=== HAMSILI DOC IN FIRESTORE ===');
    console.log('published_lineup length:', (data.published_lineup || []).length);
    console.log('lineup length:', (data.lineup || []).length);
    console.log('lineupsByRound.2 lineup length:', (data.lineupsByRound?.[2]?.lineup || []).length);
    console.log('lineupsByRound.2 lineup content:', (data.lineupsByRound?.[2]?.lineup || []).map(p=>p.name));
    console.log('squad length:', (data.squad || []).length);
    console.log('squad isStarting count:', (data.squad || []).filter(p=>p.isStarting).length);
  }
  process.exit(0);
}

inspectHamsiliDoc();
