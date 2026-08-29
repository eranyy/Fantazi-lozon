const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function seedHamsiliLineup() {
  console.log('=== SETTING DEFAULT 11 LINEUP FOR HAMSILI (ASAF) ===');
  
  const hamsiliRef = db.collection('users').doc('hamsili');
  const docSnap = await hamsiliRef.get();
  if (!docSnap.exists) {
    console.log('Hamsili user doc not found!');
    process.exit(1);
  }

  const uData = docSnap.data();
  const squad = uData.squad || uData.players || [];

  // Define starting 11 (Formation 4-4-2):
  // GK (1): מרציאנו
  // DEF (4): רביבו, לינדוויק, צ'יקו, דרוויש
  // MID (4): אצילי, גורה, בילו, סאנייה
  // FWD (2): תורג'מן, וייסמן
  const startingNames = ['מרציאנו', 'רביבו', 'לינדוויק', 'צ\'יקו', 'דרוויש', 'אצילי', 'גורה', 'בילו', 'סאנייה', 'תורג\'מן', 'וייסמן'];

  const updatedSquad = squad.map(p => {
    const isStart = startingNames.some(name => p.name.includes(name) || name.includes(p.name));
    return {
      ...p,
      isStarting: isStart,
      points: 0,
      stats: {}
    };
  });

  const startingLineup = updatedSquad.filter(p => p.isStarting);
  const bench = updatedSquad.filter(p => !p.isStarting);

  await hamsiliRef.set({
    squad: updatedSquad,
    players: updatedSquad,
    lineup: startingLineup,
    published_lineup: startingLineup,
    published_subs_out: bench,
    'lineupsByRound.2': {
      lineup: startingLineup,
      subsOut: bench,
      savedAt: new Date().toISOString()
    }
  }, { merge: true });

  console.log(`Successfully updated Hamsili starting lineup with ${startingLineup.length} players!`);
  startingLineup.forEach(p => console.log(`  - ${p.name} (${p.position})`));
  process.exit(0);
}

seedHamsiliLineup();
