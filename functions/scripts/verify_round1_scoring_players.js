const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function checkRound1Players() {
  console.log('=== VERIFYING ROUND 1 SCORING PLAYERS IN FIRESTORE ===');
  const snap = await db.collection('real_league_players_scoring').get();
  
  const players = [];
  snap.docs.forEach(doc => {
    const data = doc.data();
    players.push({
      id: doc.id,
      name: data.name,
      realTeam: data.realTeam,
      points: Number(data.points) || 0,
      isDrafted: Boolean(data.isDrafted),
      ownerTeam: data.ownerTeam || 'חופשי'
    });
  });

  // Sort by points descending
  players.sort((a, b) => b.points - a.points);

  console.log(`Total active verified players in database: ${players.length}`);
  console.log('\nTop Scoring Players from Round 1:');
  players.slice(0, 15).forEach((p, idx) => {
    console.log(`${idx + 1}. ${p.name} (${p.realTeam}) - ${p.points} נק' [קבוצה: ${p.ownerTeam}]`);
  });

  process.exit(0);
}

checkRound1Players();
