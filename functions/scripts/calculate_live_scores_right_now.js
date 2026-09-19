const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

const calculatePointsFromStats = (statsObj, pos) => {
  let p = 0; if (!statsObj) return 0;
  const isGk = ['GK', 'שוער'].includes(pos);
  const isDef = ['DEF', 'הגנה', 'בלם', 'מגן'].includes(pos);

  if (isGk && !statsObj.started && !statsObj.played60 && (statsObj.notInSquad || statsObj.notPlayedIn16)) return -1;
  if (statsObj.notInSquad) return -1;
  if (statsObj.notPlayedIn16) return 0;

  if (statsObj.started) p += 1;
  if (statsObj.played60) p += 1;
  if (statsObj.won) p += 2;

  if (isGk) p += (statsObj.goals || 0) * 10;
  else if (isDef) p += (statsObj.goals || 0) * 8;
  else p += (statsObj.goals || 0) * 5;

  if (isGk) p += (statsObj.assists || 0) * 6;
  else if (isDef) p += (statsObj.assists || 0) * 4;
  else p += (statsObj.assists || 0) * 3;

  if (statsObj.cleanSheet && (isGk || isDef) && statsObj.played60) p += isGk ? 5 : 4;
  if (isGk || isDef) p -= (statsObj.conceded || 0);

  p += (statsObj.penaltyWon || 0) * 2;
  p -= (statsObj.penaltyMissed || 0) * 3;
  if (isGk) p += (statsObj.penaltySaved || 0) * 3;
  p -= (statsObj.ownGoals || 0) * 3;
  p += (statsObj.assistOwnGoal || 0) * 2;

  if (statsObj.yellow) p -= 2;
  if (statsObj.secondYellow) p -= 2;
  if (statsObj.red) p -= 5;

  return p;
};

async function testScoresNow() {
  console.log('=== CURRENT REAL-TIME FIRESTORE TEAM SCORES FOR MATCHDAY 2 ===\n');

  const usersSnap = await db.collection('users').get();
  usersSnap.docs.forEach(doc => {
    const u = doc.data();
    if (u.teamName && doc.id !== 'admin' && doc.id !== 'system') {
      const lineup = u.published_lineup || u.lineup || (u.squad || []).slice(0, 11);
      let teamTotal = 0;
      const playerDetails = [];

      lineup.forEach(p => {
        let pts = 0;
        if (p.stats && Object.keys(p.stats).length > 0) {
          pts = calculatePointsFromStats(p.stats, p.position || p.pos || '');
        } else {
          pts = Number(p.points) || 0;
        }
        teamTotal += pts;
        if (pts !== 0 || (p.stats && (p.stats.goals || p.stats.assists))) {
          playerDetails.push(`    • ${p.name} (${p.position || p.pos}): ${pts} pts (goals: ${p.stats?.goals||0}, assists: ${p.stats?.assists||0})`);
        }
      });

      console.log(`Team: ${u.teamName} (${u.manager}) | Total Live Arena Score: ${teamTotal} pts`);
      if (playerDetails.length > 0) {
        playerDetails.forEach(line => console.log(line));
      } else {
        console.log('    • (No active scoring events yet on starting 11)');
      }
      console.log('');
    }
  });

  process.exit(0);
}

testScoresNow();
