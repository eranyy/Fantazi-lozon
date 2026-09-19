const admin = require('firebase-admin');
if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'fantasy-luzon' });
}
const db = admin.firestore();

async function inspectRound1() {
  console.log('--- Checking round_backups ---');
  const backupsSnap = await db.collection('round_backups').get();
  backupsSnap.forEach(doc => {
    console.log(`Backup ID: ${doc.id}`);
    const data = doc.data();
    if (data.teamsSnapshot) {
      console.log(`  teamsSnapshot length: ${data.teamsSnapshot.length}`);
      data.teamsSnapshot.forEach(t => {
        console.log(`    Team: ${t.id} (${t.teamName}) - published_lineup: ${t.published_lineup?.length || 0}, lineup: ${t.lineup?.length || 0}, squad: ${t.squad?.length || 0}`);
      });
    }
  });

  console.log('\n--- Checking users collection ---');
  const usersSnap = await db.collection('users').get();
  usersSnap.forEach(doc => {
    const data = doc.data();
    console.log(`User: ${doc.id} (${data.teamName})`);
    console.log(`  lineupsByRound[1]:`, data.lineupsByRound?.['1'] ? `lineup count=${data.lineupsByRound['1'].lineup?.length}, subsOut count=${data.lineupsByRound['1'].subsOut?.length}` : 'MISSING/UNDEFINED');
    console.log(`  lineupsByRound[2]:`, data.lineupsByRound?.['2'] ? `lineup count=${data.lineupsByRound['2'].lineup?.length}` : 'MISSING/UNDEFINED');
    console.log(`  published_lineup count: ${data.published_lineup?.length || 0}`);
    console.log(`  lineup count: ${data.lineup?.length || 0}`);
  });

  process.exit(0);
}

inspectRound1().catch(err => {
  console.error(err);
  process.exit(1);
});
