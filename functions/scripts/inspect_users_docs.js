const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function inspectUsersDocs() {
  console.log('=== INSPECTING ALL USER DOCUMENTS IN FIRESTORE ===\n');

  const usersSnap = await db.collection('users').get();
  usersSnap.docs.forEach(doc => {
    const u = doc.data();
    if (u.teamName && doc.id !== 'admin' && doc.id !== 'system') {
      console.log(`User ID: "${doc.id}" | TeamName: "${u.teamName}" | Manager: "${u.manager}"`);
      console.log(`  - lineup length: ${Array.isArray(u.lineup) ? u.lineup.length : 'N/A'}`);
      console.log(`  - published_lineup length: ${Array.isArray(u.published_lineup) ? u.published_lineup.length : 'N/A'}`);
      console.log(`  - squad length: ${Array.isArray(u.squad) ? u.squad.length : 'N/A'}`);
      console.log(`  - lineupsByRound keys:`, u.lineupsByRound ? Object.keys(u.lineupsByRound) : 'NONE');

      if (u.lineupsByRound && u.lineupsByRound[2]) {
        console.log(`  - lineupsByRound[2] lineup len:`, Array.isArray(u.lineupsByRound[2].lineup) ? u.lineupsByRound[2].lineup.length : 'N/A');
        if (Array.isArray(u.lineupsByRound[2].lineup)) {
          u.lineupsByRound[2].lineup.forEach(p => {
            if (p.stats && Object.keys(p.stats).length > 0) {
              console.log(`      * ${p.name} stats:`, p.stats, `pts: ${p.points}`);
            }
          });
        }
      }

      if (Array.isArray(u.published_lineup)) {
        u.published_lineup.forEach(p => {
          if (p.stats && Object.keys(p.stats).length > 0) {
            console.log(`      [published_lineup] ${p.name} stats:`, p.stats, `pts: ${p.points}`);
          }
        });
      }

      if (Array.isArray(u.lineup)) {
        u.lineup.forEach(p => {
          if (p.stats && Object.keys(p.stats).length > 0) {
            console.log(`      [lineup] ${p.name} stats:`, p.stats, `pts: ${p.points}`);
          }
        });
      }

      console.log('');
    }
  });

  process.exit(0);
}

inspectUsersDocs();
