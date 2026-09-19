const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function inspectTopPlayersDoc() {
  const docSnap = await db.doc('leagueData/top_players').get();
  console.log('Doc exists?', docSnap.exists);
  if (docSnap.exists) {
    console.log('Data keys:', Object.keys(docSnap.data()));
    console.log('Players length:', docSnap.data()?.players?.length);
    console.log('First 3 players:', docSnap.data()?.players?.slice(0, 3));
  }
}

inspectTopPlayersDoc().catch(console.error);
