const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function createFullLeagueBackup(label = 'auto_latest') {
  console.log(`[Backup] Creating full snapshot backup with label: ${label}...`);

  const usersSnap = await db.collection('users').get();
  const teamsSnapshot = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  const settingsSnap = await db.doc('leagueData/settings').get();
  const settingsSnapshot = settingsSnap.exists ? settingsSnap.data() : null;

  const fixturesSnap = await db.doc('leagueData/fixtures').get();
  const fixturesSnapshot = fixturesSnap.exists ? fixturesSnap.data() : null;

  const arenaSnap = await db.doc('liveData/arena').get();
  const arenaSnapshot = arenaSnap.exists ? arenaSnap.data() : null;

  const currentRound = settingsSnapshot?.currentRound || 1;
  const backupDocId = label === 'auto_latest' ? 'backup_auto_latest' : `backup_round_${currentRound}_${Date.now()}`;

  const backupData = {
    backupLabel: label,
    currentRound,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    isoDate: new Date().toISOString(),
    teamsCount: teamsSnapshot.length,
    teamsSnapshot,
    settingsSnapshot,
    fixturesSnapshot,
    arenaSnapshot
  };

  await db.doc(`round_backups/${backupDocId}`).set(backupData);
  // Also update latest link
  if (backupDocId !== 'backup_auto_latest') {
    await db.doc('round_backups/backup_auto_latest').set(backupData);
  }

  console.log(`✅ [Backup] Full backup successfully created at round_backups/${backupDocId} (${teamsSnapshot.length} teams saved)!`);
  return backupData;
}

if (require.main === module) {
  createFullLeagueBackup('manual_pre_task')
    .then(() => process.exit(0))
    .catch(err => {
      console.error('❌ Backup failed:', err);
      process.exit(1);
    });
}

module.exports = { createFullLeagueBackup };
