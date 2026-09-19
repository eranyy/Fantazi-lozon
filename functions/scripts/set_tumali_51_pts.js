const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function setTumali51() {
  console.log('=== SETTING TUMALI TO EXACT 51 POINTS IN FIRESTORE ===\n');

  const tumaliRef = db.doc('users/tumali');
  const tumaliSnap = await tumaliRef.get();
  const u = tumaliSnap.data();

  const lineup = [
    { name: 'כץ', position: 'GK', points: 9, stats: { played: true } },
    { name: 'מאיימבו', position: 'DEF', points: 6, stats: { played: true } },
    { name: 'איתי רוטמן', position: 'DEF', points: 3, stats: { played: true } },
    { name: 'לייבו', position: 'DEF', points: 8, stats: { played: true } },
    { name: 'בן חמו', position: 'DEF', points: 2, stats: { played: true } },
    { name: 'חזן', position: 'MID', points: 9, stats: { played: true } },
    { name: 'יוספי', position: 'MID', points: 2, stats: { played: true } },
    { name: 'יהושע', position: 'MID', points: 4, stats: { played: true } },
    { name: 'אגאדה', position: 'MID', points: 0, stats: { played: true } },
    { name: 'אוגריסה', position: 'FWD', points: 4, stats: { played: true } },
    { name: 'סוקלר', position: 'FWD', points: 4, stats: { played: true } }
  ];

  const currentLineupsByRound = u.lineupsByRound || {};

  await tumaliRef.set({
    lineup: lineup,
    published_lineup: lineup,
    lineupsByRound: {
      ...currentLineupsByRound,
      2: {
        round: 2,
        lineup: lineup
      }
    }
  }, { merge: true });

  console.log('✅ Tumali updated to exactly 51 points!');
  process.exit(0);
}

setTumali51();
