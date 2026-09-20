const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

const cleanStr = (s) => String(s || '').toLowerCase().replace(/['"״׳`\-\s()]/g, '');

const isSamePlayer = (a, b) => {
  if (!a || !b) return false;
  if (a.id && b.id && a.id === b.id) return true;
  const cA = cleanStr(a.name || a.player);
  const cB = cleanStr(b.name || b.player);
  if (!cA || !cB) return false;
  return cA === cB || cA.includes(cB) || cB.includes(cA);
};

const safeArray = (val) => Array.isArray(val) ? val : [];

async function verifyClosureScores() {
  console.log('🔍 Verifying Round 5 Closure Team Scores...\n');

  const snap = await db.collection('users').get();
  const teams = [];
  snap.forEach(d => teams.push({ id: d.id, ...d.data() }));

  const expectedScores = {
    tumali: 48,
    harale: 41,
    pichichi: 56,
    tampa: 37,
    hamsili: 67,
    holonia: 42
  };

  for (const teamId of Object.keys(expectedScores)) {
    const team = teams.find(t => t.id === teamId);
    if (!team) continue;

    const lineup = team.lineup || team.published_lineup || [];
    const transfers = safeArray(team.transfers).filter(t => t && Number(t.round) === 5 && (t.type || '').includes('HALFTIME'));

    let total = 0;

    // Lineup players sum
    lineup.forEach(p => {
      total += (p.points || 0);
    });

    // Subbed out players sum
    transfers.forEach(sub => {
      const allSquad = safeArray(team.squad);
      const benchedOut = allSquad.find(p => isSamePlayer(p, { name: sub.playerOut }));
      if (benchedOut) {
        // Find if benchedOut has points recorded
        const r5Lineup = team.lineupsByRound?.['5']?.lineup || [];
        const foundInLineup = r5Lineup.find(p => isSamePlayer(p, { name: sub.playerOut }));
        const pts = foundInLineup ? (foundInLineup.points || 0) : (benchedOut.points || 0);
        total += pts;
      }
    });

    console.log(`Team: ${teamId} | Calculated Match Score: ${total} | Expected: ${expectedScores[teamId]}`);
  }
}

verifyClosureScores().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
