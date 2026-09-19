const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function fixHamsili44() {
  const hamsiliRef = db.doc('users/hamsili');
  const snap = await hamsiliRef.get();
  const u = snap.data();

  const hamsiliLineup = [
    { name: 'מרציאנו', position: 'GK', points: 3, stats: { played: true } },
    { name: 'רביבו', position: 'DEF', points: 3, stats: { played: true } },
    { name: 'צ׳יקו', position: 'DEF', points: 4, stats: { played: true } },
    { name: 'מנדי', position: 'DEF', points: 4, stats: { played: true } },
    { name: 'לודוויק', position: 'DEF', points: -1, stats: { played: true } },
    { name: 'אצילי', position: 'MID', points: 5, stats: { played: true } },
    { name: 'בילו', position: 'MID', points: 13, stats: { played: true } },
    { name: 'גורה', position: 'MID', points: 2, stats: { played: true } },
    { name: 'סאנייה', position: 'MID', points: 9, stats: { played: true } },
    { name: 'תורג׳מן', position: 'FWD', points: 2, stats: { played: true } },
    { name: 'וייסמן', position: 'FWD', points: 2, stats: { played: true } }
  ];

  await hamsiliRef.set({
    lineup: hamsiliLineup,
    published_lineup: hamsiliLineup,
    lineupsByRound: {
      ...(u.lineupsByRound || {}),
      2: {
        round: 2,
        lineup: hamsiliLineup
      }
    }
  }, { merge: true });

  const total = hamsiliLineup.reduce((sum, pl) => sum + pl.points, 0);
  console.log(`✅ Hamsili updated to exact ${total} points!`);
  process.exit(0);
}

fixHamsili44();
