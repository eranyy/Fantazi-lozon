const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

const cleanStr = (s) => String(s || '').toLowerCase().replace(/['"״׳`\-\s()]/g, '');

const isSamePlayer = (a, b) => {
  if (!a || !b) return false;
  const cA = cleanStr(a.name || a.player || a);
  const cB = cleanStr(b.name || b.player || b);
  if (!cA || !cB) return false;
  return cA === cB || cA.includes(cB) || cB.includes(cA);
};

async function fixSquadNamesAndPoints() {
  console.log('🛠️ Harmonizing squad names and points across all teams...\n');

  const snap = await db.collection('users').get();
  for (const doc of snap.docs) {
    const teamId = doc.id;
    const data = doc.data();

    const lineup = data.lineup || data.published_lineup || [];
    const r5Lineup = data.lineupsByRound?.['5']?.lineup || lineup;
    const transfers = data.transfers || [];
    let squad = [...(data.squad || data.players || [])];

    // Align squad player names and points with lineup & transfers
    squad = squad.map(sp => {
      const matchInLineup = r5Lineup.find(lp => isSamePlayer(lp, sp));
      if (matchInLineup) {
        return {
          ...sp,
          name: matchInLineup.name, // Use same name
          points: matchInLineup.points,
          stats: matchInLineup.stats || sp.stats || {},
          isStarting: true
        };
      }

      // Check if player is a sub
      const subLog = transfers.find(t => isSamePlayer({ name: t.playerIn }, sp) || isSamePlayer({ name: t.playerOut }, sp));
      if (subLog) {
        if (isSamePlayer({ name: subLog.playerIn }, sp)) {
          return {
            ...sp,
            name: subLog.playerIn,
            isStarting: false
          };
        }
        if (isSamePlayer({ name: subLog.playerOut }, sp)) {
          return {
            ...sp,
            name: subLog.playerOut,
            isStarting: false
          };
        }
      }

      return sp;
    });

    await doc.ref.update({
      squad,
      players: squad
    });

    console.log(`  ✅ Harmonized names and points in squad for ${teamId}`);
  }

  console.log('\n🎉 SQUAD NAMES & POINTS HARMONIZED SUCCESSFULLY!');
}

fixSquadNamesAndPoints().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
