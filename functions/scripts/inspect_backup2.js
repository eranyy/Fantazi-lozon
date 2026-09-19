const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function checkBackup2() {
  const docSnap = await db.doc('round_backups/backup_round_2').get();
  if (!docSnap.exists) {
    console.log('backup_round_2 does NOT exist!');
    return;
  }
  const data = docSnap.data();
  console.log('backup_round_2 roundToRestore:', data.roundToRestore);
  console.log('backup_round_2 timestamp:', data.timestamp);
  (data.teamsSnapshot || []).forEach(t => {
    console.log(`Team ${t.id} (${t.teamName}):`);
    console.log(`  published_lineup: ${t.published_lineup?.length || 0}`);
    console.log(`  lineupsByRound:`, Object.keys(t.lineupsByRound || {}));
    if (t.lineupsByRound && t.lineupsByRound['1']) {
      console.log(`  lineupsByRound[1] count:`, t.lineupsByRound['1'].lineup?.length);
    }
  });
}

checkBackup2().catch(console.error);
