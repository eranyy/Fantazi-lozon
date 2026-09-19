const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function cleanHamsiliLineupByRound() {
  console.log('=== CLEANING HAMSILI LINEUPS BY ROUND IN FIRESTORE ===');
  
  const hRef = db.collection('users').doc('hamsili');
  const doc = await hRef.get();
  
  if (doc.exists) {
    const data = doc.data();
    const squad = data.squad || [];
    
    // Select default 11 starting players from squad
    const startingNames = ['מרציאנו', 'רביבו', 'לינדוויק', 'צ\'יקו', 'דרוויש', 'אצילי', 'גורה', 'בילו', 'סאנייה', 'תורג\'מן', 'וייסמן'];
    
    const updatedSquad = squad.map(p => ({
      ...p,
      isStarting: startingNames.some(n => p.name.includes(n) || n.includes(p.name))
    }));

    const starting11 = updatedSquad.filter(p => p.isStarting);
    const bench = updatedSquad.filter(p => !p.isStarting);

    await hRef.set({
      squad: updatedSquad,
      players: updatedSquad,
      lineup: starting11,
      published_lineup: starting11,
      published_subs_out: bench,
      'lineupsByRound.2': {
        lineup: starting11,
        subsOut: bench,
        savedAt: new Date().toISOString()
      }
    }, { merge: true });

    console.log(`Successfully reset Hamsili Round 2 lineup to complete 11-player starting lineup!`);
    console.log('Starting 11:', starting11.map(p => p.name).join(', '));
  }

  process.exit(0);
}

cleanHamsiliLineupByRound();
