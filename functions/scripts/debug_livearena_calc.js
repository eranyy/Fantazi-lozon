const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

const cleanStr = (s) => String(s || '').toLowerCase().replace(/['"״׳`\-\s()]/g, '');
const normalizeHebrewName = (s) => {
  if (!s) return '';
  let str = String(s).toLowerCase().replace(/['"״׳`\-\s()]/g, '');
  return str.replace(/א+/g, 'א').replace(/ו+/g, 'ו').replace(/י+/g, 'י');
};
const getPlayerName = (p) => {
  if (!p) return '';
  if (typeof p === 'string') return p.trim();
  const val = p.name || p.player || p.playerName || p.label || p.playerIn || p.playerOut || p.title || p.id || '';
  return typeof val === 'string' ? val.trim() : String(val).trim();
};
const isSamePlayer = (a, b) => {
  if (!a || !b) return false;
  if (a.id && b.id && a.id === b.id) return true;
  const aStr = getPlayerName(a); const bStr = getPlayerName(b);
  const cA = cleanStr(aStr); const cB = cleanStr(bStr);
  if (!cA || !cB) return false;
  const nA = normalizeHebrewName(aStr); const nB = normalizeHebrewName(bStr);
  return cA === cB || cA.includes(cB) || cB.includes(cA) || nA === nB || nA.includes(nB) || nB.includes(nA);
};

const calculatePointsFromStats = (statsObj, pos) => {
  let p = 0; if (!statsObj) return 0;
  const isGk = ['GK', 'שוער'].includes(pos);
  const isDef = ['DEF', 'הגנה', 'בלם', 'מגן'].includes(pos);

  if (isGk && !statsObj.started && !statsObj.played60 && (statsObj.notInSquad || statsObj.notPlayedIn16)) return -1;
  if (statsObj.notInSquad && !statsObj.started && !statsObj.played60) return -1;
  if (statsObj.notPlayedIn16 && !statsObj.started && !statsObj.played60) return 0;

  if (statsObj.started) p += 1;
  if (statsObj.played60) p += 1;
  if (statsObj.won) p += 2;

  if (isGk) p += (statsObj.goals || 0) * 10;
  else if (isDef) p += (statsObj.goals || 0) * 8;
  else p += (statsObj.goals || 0) * 5;

  if (isGk) p += (statsObj.assists || 0) * 6;
  else if (isDef) p += (statsObj.assists || 0) * 4;
  else p += (statsObj.assists || 0) * 3;

  if (statsObj.cleanSheet && (isGk || isDef) && statsObj.played60) {
    p += isGk ? 5 : 4;
  }
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

const isPlayerHalftimeSubOut = (player, team, rNum = 5) => {
  if (!team) return false;
  return (team.transfers || []).some((t) => 
    t && t.type === 'HALFTIME_SUB' && 
    Number(t.round) === Number(rNum) && 
    (t.status || '').toUpperCase() !== 'CANCELLED' && 
    isSamePlayer({ name: t.playerOut }, player)
  );
};

const getPlayerPointsForRound = (player, team) => {
  if (!player) return 0;
  const isHalftimeOut = isPlayerHalftimeSubOut(player, team, 5);
  if (player.stats && Object.keys(player.stats).length > 0) {
    const statsObj = { ...player.stats };
    if (isHalftimeOut && statsObj.played60 === undefined) {
      statsObj.played60 = false; statsObj.started = true;
    }
    return calculatePointsFromStats(statsObj, player.position || player.pos || '');
  }
  if (typeof player.points === 'number' && !isNaN(player.points) && player.points !== 0) return player.points;
  return 0;
};

const safeArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  return [];
};

const isSubLog = (t) => {
  if (!t || typeof t !== 'object') return false;
  const type = (t.type || '').toUpperCase();
  if (type === 'CANCELLED_SUB' || (t.status || '').toUpperCase() === 'CANCELLED') return false;
  return type === 'HALFTIME_SUB' || type === 'HALFTIME' || type === 'ADMIN_MANUAL_SUB' || type === 'MANUAL_SUB' || (type.includes('SUB') && !type.includes('VAR') && !type.includes('REGULAR'));
};

const applySubstitutionsToLineup = (team) => {
  let currentLineup = [...(team.published_lineup || team.lineup || [])];
  const bench = team.published_subs_out || [];
  const allPool = [...bench, ...safeArray(team.squad), ...safeArray(team.players)];

  const roundSubs = safeArray(team.transfers).filter((t) => isSubLog(t) && (!t.round || Number(t.round) === 5));
  roundSubs.forEach((sub) => {
    const subOutName = getPlayerName(sub.playerOut);
    const subInName = getPlayerName(sub.playerIn);
    const outIndex = currentLineup.findIndex(p => isSamePlayer(p, { name: subOutName }));
    let inPlayer = allPool.find((p) => isSamePlayer(p, { name: subInName }));
    if (outIndex !== -1 && inPlayer) { currentLineup[outIndex] = inPlayer; }
  });
  return currentLineup;
};

const calculateTeamScore = (team, tid) => {
  let total = 0;
  const currentLineup = applySubstitutionsToLineup(team);
  if (currentLineup) total += currentLineup.reduce((sum, p) => sum + getPlayerPointsForRound(p, team), 0);

  const roundSubs = safeArray(team.transfers).filter((t) => isSubLog(t) && (!t.round || Number(t.round) === 5));
  roundSubs.forEach((sub) => {
    const allPossibleOutPlayers = [...(team.published_subs_out || []), ...safeArray(team.squad), ...safeArray(team.players)];
    const benchedPlayerOut = allPossibleOutPlayers.find((p) => isSamePlayer(p, { name: sub.playerOut }));
    if (benchedPlayerOut) total += getPlayerPointsForRound(benchedPlayerOut, team);
  });
  return total;
};

async function testAll() {
  const teamIds = ['tumali', 'harale', 'pichichi', 'tampa', 'hamsili', 'holonia'];
  for (const tid of teamIds) {
    const doc = await db.collection('users').doc(tid).get();
    const team = doc.data();
    console.log('=== Team:', tid, '===');
    const lineup = applySubstitutionsToLineup(team);
    lineup.forEach(p => {
      const calcPts = getPlayerPointsForRound(p, team);
      console.log(`  ${p.name} (pos: '${p.position}', pts: ${p.points}, calcPts: ${calcPts}, stats: ${JSON.stringify(p.stats)})`);
    });
    console.log('FINAL LIVE ARENA SCORE:', calculateTeamScore(team, tid), '\n');
  }
  process.exit(0);
}
testAll();
