const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function checkHamsiliR1Points() {
  const doc = await db.collection('users').doc('hamsili').get();
  const u = doc.data();
  const r1 = u.lineupsByRound?.[1] || {};
  const lineup = r1.lineup || [];
  const subsOut = r1.subsOut || [];
  const transfers = (u.transfers || []).filter(t => t.type === 'HALFTIME_SUB' && t.round === 1 && t.status !== 'CANCELLED');

  console.log('--- HAMSILI R1 LINEUP BEFORE SUBS ---');
  let baseSum = 0;
  lineup.forEach(p => {
    console.log(`  ${p.name} (${p.position}): ${p.points || 0} pts`);
    baseSum += Number(p.points || 0);
  });
  console.log(`Base Sum before subs: ${baseSum}`);

  console.log('\n--- SUBS OUT BENCH ---');
  subsOut.forEach(p => {
    console.log(`  ${p.name} (${p.position}): ${p.points || 0} pts`);
  });

  console.log('\n--- R1 HALFTIME SUBS ---');
  console.log(transfers);

  // Apply subs to lineup
  let currentLineup = [...lineup];
  transfers.forEach(sub => {
    const outIdx = currentLineup.findIndex(p => p.name === sub.playerOut);
    const inPlayer = subsOut.find(p => p.name === sub.playerIn);
    if (outIdx !== -1 && inPlayer) {
      currentLineup[outIdx] = inPlayer;
      console.log(`Subbed out ${sub.playerOut} for ${sub.playerIn} (${inPlayer.points} pts)`);
    } else {
      console.log(`FAILED TO SUB: outIdx=${outIdx}, inPlayer=${!!inPlayer}`);
    }
  });

  console.log('\n--- HAMSILI R1 LINEUP AFTER SUBS ---');
  let postSubSum = 0;
  currentLineup.forEach(p => {
    console.log(`  ${p.name} (${p.position}): ${p.points || 0} pts`);
    postSubSum += Number(p.points || 0);
  });
  console.log(`Post Sub Total Sum: ${postSubSum}`);
}

checkHamsiliR1Points().catch(console.error);
