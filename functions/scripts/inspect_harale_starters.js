const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function inspectHaraleStarters() {
  const doc = await db.collection('users').doc('harale').get();
  const u = doc.data();
  const lineup = u.lineup || [];
  console.log('--- HARALE 11 STARTERS ---');
  lineup.forEach((p, i) => {
    console.log(`${i+1}. ${p.name} | team: "${p.team}" | realTeam: "${p.realTeam}"`);
  });
}

inspectHaraleStarters().catch(console.error);
