const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function checkLocked() {
  console.log('--- lockedLineups ---');
  const snap1 = await db.collection('lockedLineups').get();
  snap1.forEach(d => console.log('lockedLineups doc:', d.id, Object.keys(d.data())));

  console.log('--- locked_lineups ---');
  const snap2 = await db.collection('locked_lineups').get();
  snap2.forEach(d => console.log('locked_lineups doc:', d.id, Object.keys(d.data())));

  console.log('--- matchday_archive ---');
  const snap3 = await db.collection('matchday_archive').get();
  snap3.forEach(d => console.log('matchday_archive doc:', d.id, Object.keys(d.data())));

  console.log('--- round_excel_archives ---');
  const snap4 = await db.collection('round_excel_archives').get();
  snap4.forEach(d => console.log('round_excel_archives doc:', d.id, Object.keys(d.data())));
}

checkLocked().catch(console.error);
