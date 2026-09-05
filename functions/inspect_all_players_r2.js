const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function inspectTumaliPlayers() {
  console.log('=== INSPECTING TUMALI PLAYER LINEUP IN FIRESTORE ===\n');

  const docSnap = await db.doc('users/tumali').get();
  if (docSnap.exists) {
    const data = docSnap.data();
    console.log('Tumali Published Lineup:');
    (data.published_lineup || []).forEach((p, i) => {
      console.log(`  ${i+1}. ${p.name} (${p.position}) - Points: ${p.points || 0}`);
    });

    console.log('\nTumali lineupsByRound[2]:');
    (data.lineupsByRound?.[2]?.lineup || []).forEach((p, i) => {
      console.log(`  ${i+1}. ${p.name} (${p.position}) - Points: ${p.points || 0}`);
    });
  }

  process.exit(0);
}

inspectTumaliPlayers();
