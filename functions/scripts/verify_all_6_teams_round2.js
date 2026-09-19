const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function verifyAll6Teams() {
  console.log('=== VERIFYING ALL 6 TEAMS FOR ROUND 2 IN FIRESTORE ===\n');

  const usersSnap = await db.collection('users').get();
  usersSnap.docs.forEach(d => {
    const u = d.data();
    const r2Lineup = u.lineupsByRound?.[2]?.lineup || u.published_lineup || u.lineup || [];
    
    let totalPts = 0;
    r2Lineup.forEach(pl => {
      const pts = Number(pl.points) || 0;
      const isCapt = Boolean(pl.isCaptain || pl.captain);
      totalPts += isCapt ? pts * 2 : pts;
    });

    console.log(`Team: "${u.teamName || d.id}" (${u.manager}) -> Total R2 Score: ${totalPts} pts`);
  });

  process.exit(0);
}

verifyAll6Teams();
