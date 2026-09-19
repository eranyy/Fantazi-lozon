const admin = require('firebase-admin');

if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function inspectAndFixOwusu() {
  console.log('--- INSPECTING OWUSU & CORTEZ DATA IN FIRESTORE ---');

  // Search users for Owusu and Cortez in squads/lineups
  const usersSnap = await db.collection('users').get();
  usersSnap.forEach(docSnap => {
    const u = docSnap.data();
    if (docSnap.id === 'admin' || docSnap.id === 'system') return;

    const checkPlayerList = (listName, list) => {
      if (!Array.isArray(list)) return;
      list.forEach(p => {
        if (p.name && (p.name.includes('אווסו') || p.name.includes('Owusu') || p.name.includes('קורטז') || p.name.includes('Cortez'))) {
          console.log(`User ${u.teamName || docSnap.id} -> ${listName}: ${p.name} | team: ${p.team || p.realTeam} | points: ${p.points}`);
        }
      });
    };

    checkPlayerList('squad', u.squad);
    checkPlayerList('published_lineup', u.published_lineup);
    if (u.lineupsByRound) {
      Object.keys(u.lineupsByRound).forEach(r => {
        checkPlayerList(`lineupsByRound[${r}].lineup`, u.lineupsByRound[r]?.lineup);
      });
    }
  });

  // Search real_league_players_scoring
  const scoringSnap = await db.collection('real_league_players_scoring').get();
  scoringSnap.forEach(docSnap => {
    const d = docSnap.data();
    if (d.name && (d.name.includes('אווסו') || d.name.includes('Owusu') || d.name.includes('קורטז') || d.name.includes('Cortez'))) {
      console.log(`real_league_players_scoring [${docSnap.id}]: ${d.name} | team: ${d.team || d.realTeam} | points: ${d.points}`);
    }
  });
}

inspectAndFixOwusu().catch(console.error);
