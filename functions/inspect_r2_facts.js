const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function inspectRound2Details() {
  console.log('--- ROUND 2 FIXTURES & SCORES ---');
  const fixSnap = await db.doc('leagueData/fixtures').get();
  const r2 = (fixSnap.data()?.rounds || []).find(r => r.round === 2);
  console.log(JSON.stringify(r2, null, 2));

  console.log('\n--- STANDINGS ---');
  const usersSnap = await db.collection('users').get();
  const teams = [];
  usersSnap.forEach(d => {
    const data = d.data();
    if (data.teamName && d.id !== 'admin' && d.id !== 'system') {
      teams.push({
        id: d.id,
        teamName: data.teamName,
        manager: data.name || d.id,
        points: data.points || 0,
        gf: data.gf || 0,
        ga: data.ga || 0,
        diff: (data.gf || 0) - (data.ga || 0)
      });
    }
  });
  teams.sort((a,b) => b.points - a.points || b.diff - a.diff);
  console.log(teams);

  console.log('\n--- TOP PLAYERS IN ROUND 2 ---');
  const topSnap = await db.doc('leagueData/top_players').get();
  console.log(topSnap.data()?.players?.slice(0, 10));

  console.log('\n--- PREDICTOR POLL ROUND 2 ---');
  const pollSnap = await db.collection('whatsapp_polls').where('round', '==', 2).get();
  pollSnap.forEach(p => console.log(p.data()));
}

inspectRound2Details().catch(console.error);
