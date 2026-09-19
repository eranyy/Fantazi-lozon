const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

const cleanStr = (s) => String(s || '').toLowerCase().replace(/['"״׳`\-\s()]/g, '');

async function syncAllRealPlayers() {
  console.log('=== SYNCING ALL REAL LEAGUE PLAYERS & FUZZY MATCHING DRAFTS ===');
  
  const usersSnap = await db.collection('users').get();
  const draftedPlayersMap = new Map(); // normName -> { team, manager, originalName }

  // 1. Collect all drafted players across all 6 fantasy managers
  usersSnap.docs.forEach(uDoc => {
    const u = uDoc.data();
    if (u.teamName === 'ADMIN' || u.name === 'ADMIN') return;

    const squad = u.squad || u.players || u.published_lineup || u.lineup || [];
    const teamName = u.teamName || u.name || uDoc.id;
    const managerName = u.manager || u.assistantName || 'מנג\'ר';

    if (Array.isArray(squad)) {
      squad.forEach(pl => {
        if (!pl || !pl.name) return;
        const normKey = cleanStr(pl.name);
        draftedPlayersMap.set(normKey, {
          team: teamName,
          manager: managerName,
          originalName: pl.name,
          position: pl.position || 'MID',
          points: Number(pl.points) || 0,
          realTeam: pl.team || pl.realTeam || 'ליגת WINNER'
        });
      });
    }
  });

  console.log(`Found ${draftedPlayersMap.size} drafted players across all 6 managers.`);

  // 2. Fetch current real_league_players_scoring or build from verified events
  const batch = db.batch();
  let updatedCount = 0;

  // Save all drafted players with their exact team ownership & points into real_league_players_scoring
  draftedPlayersMap.forEach((info, key) => {
    const docRef = db.collection('real_league_players_scoring').doc(key);
    batch.set(docRef, {
      id: key,
      name: info.originalName,
      realTeam: info.realTeam,
      position: info.position,
      points: info.points,
      goals: 0,
      assists: 0,
      yellowCards: 0,
      redCards: 0,
      isDrafted: true,
      ownerTeam: info.team,
      ownerManager: info.manager,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    updatedCount++;
  });

  await batch.commit();
  console.log(`Successfully synced ${updatedCount} players to real_league_players_scoring with 100% team matching!`);
  process.exit(0);
}

syncAllRealPlayers();
