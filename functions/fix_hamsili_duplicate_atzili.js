const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

const cleanStr = (s) => String(s || '').toLowerCase().replace(/['"״׳`\-\s()]/g, '');

async function fixHamsiliDuplicates() {
  console.log('=== FIXING HAMSILI DUPLICATE ATZILI & CLEANING DUMMY FREE AGENTS ===');
  
  const hamsiliRef = db.collection('users').doc('hamsili');
  const hSnap = await hamsiliRef.get();
  
  if (hSnap.exists) {
    const data = hSnap.data();
    const squad = data.squad || data.players || [];
    
    // Filter out duplicates of Atzili (keep only one: 'עומר אצילי')
    const seenNames = new Set();
    const cleanedSquad = [];
    
    squad.forEach(p => {
      if (!p || !p.name) return;
      const norm = cleanStr(p.name);
      
      // If name is 'אצילי' or 'עומראצילי', normalize to 'עומר אצילי'
      if (norm === 'אצילי' || norm === 'עומראצילי') {
        if (!seenNames.has('עומראצילי')) {
          seenNames.add('עומראצילי');
          cleanedSquad.push({
            ...p,
            name: 'עומר אצילי',
            position: 'MID',
            team: 'מכבי חיפה'
          });
        }
      } else {
        if (!seenNames.has(norm)) {
          seenNames.add(norm);
          cleanedSquad.push(p);
        }
      }
    });

    await hamsiliRef.set({
      squad: cleanedSquad,
      players: cleanedSquad
    }, { merge: true });

    console.log(`Hamsili squad cleaned! Total players now: ${cleanedSquad.length}`);
    cleanedSquad.forEach(p => console.log(`  - ${p.name} (${p.position})`));
  }

  // 2. Wipe ALL unverified manually seeded free agents (Dia Saba, etc.) from real_league_players_scoring
  const snap = await db.collection('real_league_players_scoring').get();
  const batch = db.batch();
  let deletedCount = 0;

  snap.docs.forEach(docSnap => {
    const dData = docSnap.data();
    // Delete any entry that is NOT drafted AND was not created by verified live scraper event
    if (!dData.isDrafted && !dData.verifiedLiveEvent) {
      batch.delete(docSnap.ref);
      deletedCount++;
    }
  });

  await batch.commit();
  console.log(`Purged ${deletedCount} manual unverified free agent entries from real_league_players_scoring.`);
  process.exit(0);
}

fixHamsiliDuplicates();
