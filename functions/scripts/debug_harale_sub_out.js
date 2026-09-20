const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

const cleanStr = (s) => String(s || '').toLowerCase().replace(/['"״׳`\-\s()]/g, '');

const isSamePlayer = (a, b) => {
  if (!a || !b) return false;
  if (a.id && b.id && a.id === b.id) return true;
  const cA = cleanStr(a.name || a.player);
  const cB = cleanStr(b.name || b.player);
  if (!cA || !cB) return false;
  return cA === cB || cA.includes(cB) || cB.includes(cA);
};

const safeArray = (val) => Array.isArray(val) ? val : [];

async function debugHaraleSubOut() {
  const snap = await db.collection('users').doc('harale').get();
  const team = snap.data();
  const roundSubs = safeArray(team.transfers).filter(t => Number(t.round) === 5 && (t.type || '').includes('HALFTIME'));

  console.log('Harale Transfers:', JSON.stringify(roundSubs, null, 2));

  const allPossibleOutPlayers = [...safeArray(team.published_subs_out), ...safeArray(team.squad)];
  roundSubs.forEach(sub => {
    const benchedOut = allPossibleOutPlayers.find(p => isSamePlayer(p, { name: sub.playerOut }));
    console.log(`Sub out: "${sub.playerOut}" -> Benched found:`, benchedOut ? `${benchedOut.name} (pts: ${benchedOut.points})` : 'NOT FOUND');
  });
}

debugHaraleSubOut().then(() => process.exit(0));
