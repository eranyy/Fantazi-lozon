const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function inspectTumali() {
  console.log('=== INSPECTING TUMALI AND OTHER TEAMS IN FIRESTORE ===\n');

  const usersSnap = await db.collection('users').get();
  usersSnap.docs.forEach(doc => {
    const u = doc.data();
    console.log(`Team Doc ID: "${doc.id}" | Name: "${u.teamName || u.name}" | Manager: "${u.manager}"`);
    
    const r2Data = u.lineupsByRound?.[2] || u.lineupsByRound?.['2'];
    console.log(`  - lineupsByRound[2] exists? ${Boolean(r2Data)}`);
    if (r2Data) {
      console.log(`  - lineup length: ${r2Data.lineup?.length || 0}`);
      const totalR2Pts = (r2Data.lineup || []).reduce((sum, pl) => sum + (Number(pl.points) || 0), 0);
      console.log(`  - Total R2 Points: ${totalR2Pts}`);
    }
    
    const published = u.published_lineup || u.lineup || [];
    const pubPts = published.reduce((sum, pl) => sum + (Number(pl.points) || 0), 0);
    console.log(`  - Current Published Lineup Points: ${pubPts}`);
    console.log('');
  });

  process.exit(0);
}

inspectTumali();
