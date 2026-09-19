const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function updateTopPlayers() {
  console.log('Calculating Top Players (לשונית מלאכים) across rounds...');
  
  const usersSnap = await db.collection('users').get();
  const playerMap = {};

  usersSnap.forEach(docSnap => {
    const user = docSnap.data();
    if (docSnap.id === 'admin' || docSnap.id === 'system') return;

    const teamName = user.teamName || docSnap.id;
    const lineupsByRound = user.lineupsByRound || {};

    Object.keys(lineupsByRound).forEach(rNum => {
      const rData = lineupsByRound[rNum];
      if (rData && Array.isArray(rData.lineup)) {
        rData.lineup.forEach(p => {
          if (!p.name) return;
          const key = p.name.trim();
          if (!playerMap[key]) {
            playerMap[key] = {
              name: p.name,
              team: p.team || p.realTeam || '',
              fantasyTeamName: teamName,
              points: 0
            };
          }
          playerMap[key].points += Number(p.points || 0);
        });
      }
    });
  });

  const sortedTop = Object.values(playerMap)
    .filter(p => p.points > 0)
    .sort((a, b) => b.points - a.points);

  console.log(`Calculated ${sortedTop.length} top players. Top 10:`);
  sortedTop.slice(0, 10).forEach((p, idx) => {
    console.log(`  ${idx + 1}. ${p.name} (${p.fantasyTeamName} / ${p.team}) - ${p.points} pts`);
  });

  await db.doc('leagueData/top_players').set({
    players: sortedTop,
    lastUpdated: new Date().toISOString()
  });

  console.log('✅ leagueData/top_players updated successfully!');
}

updateTopPlayers().catch(console.error);
