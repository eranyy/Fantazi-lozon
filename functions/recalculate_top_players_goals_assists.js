const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

const cleanStr = (s) => String(s || '').toLowerCase().replace(/['"״׳`\-\s().]/g, '');

async function recalculateTopPlayers() {
  console.log('=== RECALCULATING TOP PLAYERS GOALS, ASSISTS AND POINTS ===\n');

  const usersSnap = await db.collection('users').get();
  const playerMap = {};

  usersSnap.docs.forEach(doc => {
    if (doc.id === 'admin' || doc.id === 'system') return;
    const u = doc.data();
    const fantasyTeamName = u.teamName || u.name || u.manager || doc.id;
    const lineupsByRound = u.lineupsByRound || {};

    Object.keys(lineupsByRound).forEach(rNum => {
      const rData = lineupsByRound[rNum];
      if (rData && Array.isArray(rData.lineup)) {
        rData.lineup.forEach((p) => {
          if (!p.name) return;
          const key = cleanStr(p.name);
          if (!playerMap[key]) {
            playerMap[key] = {
              name: p.name,
              team: p.team || p.realTeam || '',
              fantasyTeamName: fantasyTeamName,
              points: 0,
              goals: 0,
              assists: 0
            };
          }
          playerMap[key].points += Number(p.points || 0);
          if (p.stats) {
            playerMap[key].goals += Number(p.stats.goals || 0);
            playerMap[key].assists += Number(p.stats.assists || 0);
          }
        });
      }
    });
  });

  const updatedPlayersList = Object.values(playerMap).sort((a, b) => b.points - a.points);
  console.log(`Computed top players count: ${updatedPlayersList.length}`);
  updatedPlayersList.slice(0, 15).forEach((p, i) => {
    console.log(`  ${i+1}. ${p.name} (${p.fantasyTeamName}) -> Pts: ${p.points}, Goals: ${p.goals}, Assists: ${p.assists}`);
  });

  await db.doc('leagueData/top_players').set({
    players: updatedPlayersList,
    updatedAt: new Date().toISOString()
  }, { merge: true });

  console.log('\n✅ Successfully updated leagueData/top_players in Firestore!');
  process.exit(0);
}

recalculateTopPlayers();
