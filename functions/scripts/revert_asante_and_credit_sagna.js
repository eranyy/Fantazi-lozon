const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function fixStats() {
  console.log('=== FIXING ASANTE & SAGNA IN FIRESTORE ===');

  // 1. Revert Asante in tumali lineup if it was accidentally modified
  const tumaliSnap = await db.collection('users').doc('tumali').get();
  if (tumaliSnap.exists) {
    const data = tumaliSnap.data();
    const lineup = data.lineup || [];
    let modified = false;

    const updatedLineup = lineup.map(pl => {
      if (pl.name === 'אסנטה') {
        const stats = pl.stats || {};
        if (stats.goals > 0) {
          console.log('Reverting Asante goal in Tumali lineup');
          modified = true;
          return {
            ...pl,
            stats: { ...stats, goals: 0 }
          };
        }
      }
      return pl;
    });

    if (modified) {
      await db.collection('users').doc('tumali').set({
        lineup: updatedLineup,
        published_lineup: updatedLineup
      }, { merge: true });
    }
  }

  // 2. Credit Sagna goal in hamsili lineup
  const hamsiliSnap = await db.collection('users').doc('hamsili').get();
  if (hamsiliSnap.exists) {
    const data = hamsiliSnap.data();
    const lineup = data.lineup || [];
    let modified = false;

    const updatedLineup = lineup.map(pl => {
      if (pl.name === 'סאנייה') {
        console.log('Crediting Sagna (סאנייה) goal in Hamsili lineup (+5 pts)');
        modified = true;
        const currentStats = pl.stats || {};
        return {
          ...pl,
          points: (Number(pl.points) || 0) + 5,
          stats: {
            ...currentStats,
            goals: (currentStats.goals || 0) + 1
          }
        };
      }
      return pl;
    });

    if (modified) {
      await db.collection('users').doc('hamsili').set({
        lineup: updatedLineup,
        published_lineup: updatedLineup
      }, { merge: true });
    }
  }

  process.exit(0);
}

fixStats();
