const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

const cleanStr = (s) => String(s || '').toLowerCase().replace(/['"״׳`\-\s()]/g, '');

async function debugHaraleSum() {
  const snap = await db.collection('users').doc('harale').get();
  const team = snap.data();
  const lineup = team.published_lineup || team.lineup || [];

  let sum = 0;
  console.log('=== HARALE LINEUP ===');
  lineup.forEach(p => {
    console.log(`  ${p.name}: ${p.points}`);
    sum += (p.points || 0);
  });
  console.log(`Lineup Sum: ${sum}`);

  console.log('=== HARALE TRANSFERS ===');
  (team.transfers || []).forEach(t => {
    if (Number(t.round) === 5) {
      console.log(`  Sub: out "${t.playerOut}" -> in "${t.playerIn}"`);
    }
  });
}

debugHaraleSum().then(() => process.exit(0));
