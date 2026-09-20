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

async function debugHaraleStepByStep() {
  const snap = await db.collection('users').doc('harale').get();
  const team = snap.data();

  const lineup = team.published_lineup || team.lineup || [];
  console.log('--- STARTING LINEUP ---');
  let sum1 = 0;
  lineup.forEach(p => {
    console.log(`  ${p.name}: ${p.points}`);
    sum1 += (p.points || 0);
  });
  console.log('Starting Lineup Sum:', sum1);

  // Apply subs
  let currentLineup = [...lineup];
  const roundSubs = (team.transfers || []).filter(t => t && Number(t.round) === 5 && (t.type || '').includes('HALFTIME'));
  
  console.log('\n--- SUBS LOG ---');
  roundSubs.forEach(sub => console.log(`  Out: "${sub.playerOut}" -> In: "${sub.playerIn}"`));

  roundSubs.forEach(sub => {
    const outIndex = currentLineup.findIndex(p => isSamePlayer(p, { name: sub.playerOut }));
    const allPool = [...(team.published_subs_out || []), ...(team.squad || [])];
    let inPlayer = allPool.find(p => isSamePlayer(p, { name: sub.playerIn }));
    if (outIndex !== -1 && inPlayer) {
      console.log(`Replacing index ${outIndex} (${currentLineup[outIndex].name}: ${currentLineup[outIndex].points}) with (${inPlayer.name}: ${inPlayer.points})`);
      currentLineup[outIndex] = inPlayer;
    }
  });

  let sum2 = 0;
  console.log('\n--- AFTER SUBS LINEUP ---');
  currentLineup.forEach(p => {
    console.log(`  ${p.name}: ${p.points}`);
    sum2 += (p.points || 0);
  });
  console.log('After Subs Lineup Sum:', sum2);

  let subOutPointsSum = 0;
  roundSubs.forEach(sub => {
    const allPossibleOut = [...(team.published_subs_out || []), ...(team.squad || [])];
    const foundOut = allPossibleOut.find(p => isSamePlayer(p, { name: sub.playerOut }));
    const pts = foundOut ? (foundOut.points || 0) : 0;
    console.log(`Sub Out "${sub.playerOut}" -> Found: ${foundOut?.name} (pts: ${pts})`);
    subOutPointsSum += pts;
  });

  console.log('\nSub Out Points Sum:', subOutPointsSum);
  console.log('TOTAL MATCH SCORE:', sum2 + subOutPointsSum);
}

debugHaraleStepByStep().then(() => process.exit(0));
