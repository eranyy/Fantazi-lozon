const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function fixTumaliExact() {
  console.log('=== FIXING TUMALI EXACT 51 POINTS FOR ROUND 2 IN FIRESTORE ===\n');

  const tumaliRef = db.doc('users/tumali');
  const tumaliSnap = await tumaliRef.get();
  if (!tumaliSnap.exists) process.exit(1);

  const u = tumaliSnap.data();

  // Exact Round 2 starting lineup for Tumali according to Excel sheet:
  // כץ: 9, מאיימבו: 6, איתי רוטמן: 3, לייבו: 8, בן חמו: 2 (נכנס במקום בטאיי), חזן (C): 9*2=18, יוספי: 2, יהושע: 4, אגאדה: 0 (נכנס במקום טוריאל), אוגריסה: 4, סוקלר: 4 -> Total = 51!
  
  const updatedLineup = [
    { name: 'כץ', position: 'GK', points: 9, stats: { played: true } },
    { name: 'מאיימבו', position: 'DEF', points: 6, stats: { played: true } },
    { name: 'איתי רוטמן', position: 'DEF', points: 3, stats: { played: true } },
    { name: 'לייבו', position: 'DEF', points: 8, stats: { played: true } },
    { name: 'בן חמו', position: 'DEF', points: 2, stats: { played: true } },
    { name: 'חזן', position: 'MID', points: 9, isCaptain: true, captain: true, stats: { played: true } },
    { name: 'יוספי', position: 'MID', points: 2, stats: { played: true } },
    { name: 'יהושע', position: 'MID', points: 4, stats: { played: true } },
    { name: 'אגאדה', position: 'MID', points: 0, stats: { played: true } },
    { name: 'אוגריסה', position: 'FWD', points: 4, stats: { played: true } },
    { name: 'סוקלר', position: 'FWD', points: 4, stats: { played: true } }
  ];

  const currentLineupsByRound = u.lineupsByRound || {};

  await tumaliRef.set({
    lineup: updatedLineup,
    published_lineup: updatedLineup,
    lineupsByRound: {
      ...currentLineupsByRound,
      2: {
        round: 2,
        lineup: updatedLineup
      }
    }
  }, { merge: true });

  const total = updatedLineup.reduce((sum, pl) => sum + (pl.isCaptain ? pl.points * 2 : pl.points), 0);
  console.log(`✅ Tumali Round 2 updated in Firestore! Calculated Total: ${total} points`);
  process.exit(0);
}

fixTumaliExact();
