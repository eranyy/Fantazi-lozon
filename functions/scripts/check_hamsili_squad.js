const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function checkHamsiliSquad() {
  console.log('=== CHECKING HAMSILI SQUAD IN FIRESTORE ===');
  const snap = await db.collection('users').get();
  
  snap.docs.forEach(doc => {
    const u = doc.data();
    if (doc.id.includes('hamsili') || String(u.teamName).includes('חמסילי') || String(u.manager).includes('אסף')) {
      console.log(`User ID: ${doc.id}`);
      console.log(`Team Name: ${u.teamName}`);
      console.log(`Manager: ${u.manager}`);
      console.log('Lineup players:');
      (u.lineup || []).forEach(p => console.log(`  - ${p.name} (${p.position})`));
      console.log('Published lineup players:');
      (u.published_lineup || []).forEach(p => console.log(`  - ${p.name} (${p.position})`));
      console.log('Squad / Drafted players:');
      (u.squad || u.players || []).forEach(p => console.log(`  - ${p.name} (${p.position})`));
    }
  });

  process.exit(0);
}

checkHamsiliSquad();
