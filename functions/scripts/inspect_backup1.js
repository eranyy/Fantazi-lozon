const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function checkBackup1() {
  const docSnap = await db.doc('round_backups/backup_round_1').get();
  if (!docSnap.exists) {
    console.log('backup_round_1 does NOT exist!');
    const all = await db.collection('round_backups').get();
    all.forEach(d => console.log('Found backup doc:', d.id));
    return;
  }
  const data = docSnap.data();
  console.log('backup_round_1 timestamp:', data.timestamp);
  console.log('teamsSnapshot:');
  (data.teamsSnapshot || []).forEach(t => {
    console.log(`Team ${t.id} (${t.teamName}): ${t.published_lineup?.length || 0} starters in published_lineup`);
    if (t.published_lineup && t.published_lineup.length > 0) {
      console.log('  Starters:', t.published_lineup.map(p => p.name).join(', '));
    }
  });
}

checkBackup1().catch(console.error);
