const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function checkPollsAndPredictor() {
  console.log('--- WHATSAPP POLLS ---');
  const pollsSnap = await db.collection('whatsapp_polls').get();
  if (pollsSnap.empty) {
    console.log('No docs in whatsapp_polls collection.');
  } else {
    pollsSnap.forEach(doc => console.log(doc.id, doc.data()));
  }

  console.log('\n--- PREDICTOR STANDINGS ---');
  const predSnap = await db.doc('leagueData/predictor_standings').get();
  if (predSnap.exists) {
    console.log(predSnap.data());
  } else {
    console.log('No predictor_standings doc found.');
  }
}

checkPollsAndPredictor().catch(console.error);
