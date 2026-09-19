const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function updateSagnaHamsili() {
  console.log('=== VERIFYING & UPDATING AMADOU SAGNA FOR HAMSILI ===');

  const hamsiliRef = db.collection('users').doc('hamsili');
  const snap = await hamsiliRef.get();

  if (snap.exists) {
    const data = snap.data();
    const lineup = data.lineup || [];
    const squad = data.squad || [];

    console.log(`Hamsili team manager: ${data.manager}`);

    let updatedLineup = lineup.map(pl => {
      if (pl.name === 'סאנייה' || pl.name.includes('סאנייה') || pl.name.includes('סניה') || pl.name.includes('אסנייה')) {
        console.log(`Found Sagna in lineup! Current stats:`, pl.stats, `Current pts: ${pl.points}`);
        const stats = pl.stats || {};
        const goals = Math.max(1, (stats.goals || 0));
        return {
          ...pl,
          points: Math.max(5, (Number(pl.points) || 0) + (stats.goals ? 0 : 5)),
          stats: {
            ...stats,
            goals: goals,
            started: true,
            played60: true
          }
        };
      }
      return pl;
    });

    let updatedSquad = squad.map(pl => {
      if (pl.name === 'סאנייה' || pl.name.includes('סאנייה') || pl.name.includes('סניה') || pl.name.includes('אסנייה')) {
        const stats = pl.stats || {};
        return {
          ...pl,
          points: Math.max(5, (Number(pl.points) || 0) + (stats.goals ? 0 : 5)),
          stats: {
            ...stats,
            goals: Math.max(1, (stats.goals || 0))
          }
        };
      }
      return pl;
    });

    await hamsiliRef.set({
      lineup: updatedLineup,
      published_lineup: updatedLineup,
      squad: updatedSquad
    }, { merge: true });

    console.log('Successfully updated Sagna (+5 pts goal) in Hamsili lineup, published_lineup, and squad!');
  }

  // Also update real_league_players_scoring doc for "סאנייה"
  const realRef = db.collection('real_league_players_scoring').doc('סאנייה');
  await realRef.set({
    id: 'סאנייה',
    name: 'סאנייה (אמאדו)',
    realTeam: 'עירוני קרית שמונה',
    position: 'MID',
    points: 5,
    goals: 1,
    isDrafted: true,
    ownerTeam: 'חמסילי',
    ownerManager: 'ערן & אסף',
    updatedAt: new Date().toISOString()
  }, { merge: true });

  console.log('Successfully updated real_league_players_scoring doc for סאנייה!');
  process.exit(0);
}

updateSagnaHamsili();
