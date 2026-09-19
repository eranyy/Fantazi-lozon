const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function verifyTumali() {
  console.log('=== VERIFYING TUMALI PLAYER MATCHES ===\n');

  const docSnap = await db.doc('users/tumali').get();
  const u = docSnap.data();
  const lineup = u.lineupsByRound?.[2]?.lineup || [];

  console.log('Tumali Lineup for Round 2 in Firestore:');
  lineup.forEach((p, idx) => {
    console.log(`  ${idx+1}. Name: "${p.name}" | Pos: ${p.position} | Pts: ${p.points} | Capt: ${Boolean(p.isCaptain || p.captain)}`);
  });

  const totalPts = lineup.reduce((sum, pl) => {
    const pts = Number(pl.points) || 0;
    const isCapt = pl.isCaptain || pl.captain;
    return sum + (isCapt ? pts * 2 : pts);
  }, 0);

  console.log(`\nTumali Total Calculated Points (with Captain multiplier): ${totalPts}`);
  process.exit(0);
}

verifyTumali();
