const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

const norm = (s) => String(s || '').toLowerCase().replace(/['"״׳`\-\s()]/g, '').replace(/יי/g, 'י').replace(/וו/g, 'ו');

async function checkKanaan() {
  console.log('=== CHECKING KANA\'AN ("כנעאן") IN FIRESTORE ===\n');

  const usersSnap = await db.collection('users').get();
  let foundInTeam = null;
  let foundPlayer = null;

  usersSnap.docs.forEach(doc => {
    const u = doc.data();
    const squad = u.squad || [];
    squad.forEach(pl => {
      if (norm(pl.name).includes('כנעאן') || norm(pl.name).includes('כנען')) {
        foundInTeam = { id: doc.id, data: u };
        foundPlayer = pl;
      }
    });
  });

  if (foundPlayer && foundInTeam) {
    console.log(`✅ Player Found: "${foundPlayer.name}" (${foundPlayer.realTeam || foundPlayer.team || 'הפועל ב"ש'})`);
    console.log(`   Fantasy Team: ${foundInTeam.data.teamName} (Manager: ${foundInTeam.data.manager})`);
    console.log(`   Position: ${foundPlayer.position || foundPlayer.pos}`);
    console.log(`   Current points: ${foundPlayer.points}`);
  } else {
    console.log('ℹ️ "כנעאן" is not currently drafted in fantasy squads (Free Agent).');
  }

  process.exit(0);
}

checkKanaan();
