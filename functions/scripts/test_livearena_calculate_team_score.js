const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

const cleanStr = (s) => String(s || '').toLowerCase().replace(/['"״׳`\-\s()]/g, '');

const normalizeHebrewName = (s) => {
  if (!s) return '';
  let str = String(s).toLowerCase().replace(/['"״׳`\-\s()]/g, '');
  return str.replace(/א+/g, 'א').replace(/ו+/g, 'ו').replace(/י+/g, 'י');
};

const isSamePlayer = (a, b) => {
  if (!a || !b) return false;
  if (a.id && b.id && a.id === b.id) return true;
  const aStr = a.name || a.player || a;
  const bStr = b.name || b.player || b;
  const cA = cleanStr(aStr);
  const cB = cleanStr(bStr);
  if (!cA || !cB) return false;
  const nA = normalizeHebrewName(aStr);
  const nB = normalizeHebrewName(bStr);
  return cA === cB || cA.includes(cB) || cB.includes(cA) || nA === nB || nA.includes(nB) || nB.includes(nA);
};

const safeArray = (val) => Array.isArray(val) ? val : [];

const isSubLog = (t) => {
  if (!t || typeof t !== 'object') return false;
  const type = (t.type || '').toUpperCase();
  if (type === 'CANCELLED_SUB' || (t.status || '').toUpperCase() === 'CANCELLED') return false;
  return type === 'HALFTIME_SUB' || type === 'HALFTIME' || type === 'ADMIN_MANUAL_SUB' || type === 'MANUAL_SUB' || (type.includes('SUB') && !type.includes('VAR') && !type.includes('REGULAR'));
};

async function testExactLiveArenaScores() {
  console.log('🧪 Testing Exact LiveArena calculateTeamScore Logic...\n');
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

    const selectedRound = 5;

    // Simulate getRoundLineup
    const getRoundLineup = () => {
      if (team.lineupsByRound && team.lineupsByRound[selectedRound] && Array.isArray(team.lineupsByRound[selectedRound].lineup) && team.lineupsByRound[selectedRound].lineup.length > 0) {
        return team.lineupsByRound[selectedRound].lineup;
      }
      return safeArray(team.published_lineup || team.lineup).length > 0 ? safeArray(team.published_lineup || team.lineup) : safeArray(team.squad).slice(0, 11);
    };

    // Simulate getRoundBench
    const getRoundBench = () => {
      if (team.lineupsByRound && team.lineupsByRound[selectedRound] && Array.isArray(team.lineupsByRound[selectedRound].subsOut)) {
        return team.lineupsByRound[selectedRound].subsOut;
      }
      return safeArray(team.published_subs_out).length > 0 ? safeArray(team.published_subs_out) : safeArray(team.squad).slice(11);
    };

    // Simulate applySubstitutionsToLineup
    const applySubstitutionsToLineup = () => {
      let currentLineup = [...getRoundLineup()];
      const bench = getRoundBench();
      const allPool = [...bench, ...safeArray(team.squad), ...safeArray(team.players)];

      const roundSubs = safeArray(team.transfers).filter(t => isSubLog(t) && (!t.round || Number(t.round) === Number(selectedRound)));
      roundSubs.forEach((sub) => {
        const outIndex = currentLineup.findIndex(p => isSamePlayer(p, { name: sub.playerOut }));
        let inPlayer = allPool.find(p => isSamePlayer(p, { name: sub.playerIn }));
        if (!inPlayer) {
          inPlayer = { name: sub.playerIn, points: 0 };
        }
        if (outIndex !== -1 && inPlayer) { currentLineup[outIndex] = inPlayer; }
      });
      return currentLineup;
    };

    // Calculate Team Score
    let total = 0;
    const currentLineup = applySubstitutionsToLineup();
    if (currentLineup) total += currentLineup.reduce((sum, p) => sum + (p.points || 0), 0);

    const roundSubs = safeArray(team.transfers).filter(t => isSubLog(t) && (!t.round || Number(t.round) === Number(selectedRound)));
    roundSubs.forEach((sub) => {
      const allPossibleOutPlayers = [...getRoundBench(), ...safeArray(team.squad), ...safeArray(team.players)];
      const benchedPlayerOut = allPossibleOutPlayers.find(p => isSamePlayer(p, { name: sub.playerOut }));
      if (benchedPlayerOut) {
        total += (benchedPlayerOut.points || 0);
      }
    });

    const expected = expectedScores[teamId];
    const match = total === expected ? '✅ MATCH!' : `❌ MISMATCH (Expected ${expected})`;
    console.log(`Team: ${teamId} (${team.teamName || team.name}) -> Calculated: ${total} | Expected: ${expected} | ${match}`);
  }
}

testExactLiveArenaScores().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
