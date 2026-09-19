const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

const cleanStr = (s) => String(s || '').toLowerCase().replace(/['"״׳`\-\s()]/g, '');

// List of players confirmed to have left Israel Premier League or retired
const DEPARTED_OR_RETIRED = [
  'ערן זהבי', 'דין דוד', 'פרנצדי פיירו', 'קינגס קאנגווה', 
  'גבי קניקובסקי', 'השאם לאיוס', 'חזיזה', 'דולב חזיזה'
];

async function purgeUnverifiedTransfers() {
  console.log('=== PURGING DEPARTED / UNVERIFIED PLAYERS FROM FIRESTORE ===');
  
  const snap = await db.collection('real_league_players_scoring').get();
  const batch = db.batch();
  let deletedCount = 0;

  snap.docs.forEach(docSnap => {
    const data = docSnap.data();
    const pName = data.name || '';
    
    const isDeparted = DEPARTED_OR_RETIRED.some(dep => 
      cleanStr(pName).includes(cleanStr(dep)) || cleanStr(dep).includes(cleanStr(pName))
    );

    // Delete if departed OR if it's an unverified free agent with 0 points
    if (isDeparted || (!data.isDrafted && Number(data.points) === 0 && !data.updatedByScraper)) {
      batch.delete(docSnap.ref);
      deletedCount++;
    }
  });

  await batch.commit();
  console.log(`Successfully purged ${deletedCount} unverified / departed player entries!`);
  process.exit(0);
}

purgeUnverifiedTransfers();
