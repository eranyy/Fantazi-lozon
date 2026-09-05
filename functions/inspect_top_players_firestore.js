const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function inspectTopPlayers() {
  console.log('=== INSPECTING LEAGUEDATA/TOP_PLAYERS IN FIRESTORE ===\n');

  const docSnap = await db.doc('leagueData/top_players').get();
  if (docSnap.exists) {
    const data = docSnap.data();
    console.log('Top players count:', data.players?.length);
    (data.players || []).slice(0, 10).forEach((p, idx) => {
      console.log(`  ${idx+1}. ${p.name} (${p.team}) -> Pts: ${p.points}, Goals: ${p.goals}, Assists: ${p.assists}, Fantasy: ${p.fantasyTeamName}`);
    });
  } else {
    console.log('Document leagueData/top_players does NOT exist!');
  }

  process.exit(0);
}

inspectTopPlayers();
