const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

const cleanStr = (s) => String(s || '').toLowerCase().replace(/['"״׳`\-\s()]/g, '');

const normalizeHebrewName = (s) => {
  if (!s) return '';
  let str = String(s).toLowerCase().replace(/['"״׳`\-\s()]/g, '');
  return str.replace(/א+/g, 'א').replace(/ו+/g, 'ו').replace(/י+/g, 'י');
};

const isSamePlayer = (a, b) => {
  if (!a || !b) return false;
  const aStr = a.name || a.player || a;
  const bStr = b.name || b.player || b;
  const cA = cleanStr(aStr);
  const cB = cleanStr(bStr);
  if (!cA || !cB) return false;
  const nA = normalizeHebrewName(aStr);
  const nB = normalizeHebrewName(bStr);
  return cA === cB || cA.includes(cB) || cB.includes(cA) || nA === nB || nA.includes(nB) || nB.includes(nA);
};

const subOutFixes = {
  tumali: [
    { name: 'לייבו', points: 0, stats: { started: true, played60: false, won: false, conceded: 1 } },
    { name: 'קריצ\'אק', points: -1, stats: { started: true, played60: false, won: false, conceded: 2 } }
  ],
  harale: [
    { name: 'אריק בילה', points: 2, stats: { started: true, played60: false, won: false } },
    { name: 'רועי דוד', points: 1, stats: { started: true, played60: false, won: false } }
  ],
  tampa: [
    { name: 'סלמן', points: 3, stats: { started: true, played60: false, won: true } }
  ],
  hamsili: [
    { name: 'סלם', points: -2, stats: { started: true, played60: false, won: false, conceded: 3 } },
    { name: 'מנדי', points: -1, stats: { started: true, played60: false, won: false, conceded: 2 } },
    { name: 'לינדוויק', points: 2, stats: { started: true, played60: false, won: true, conceded: 1 } }
  ],
  holonia: [
    { name: 'אלטמן', points: 3, stats: { started: true, played60: false, won: true } },
    { name: 'וארלה', points: 3, stats: { started: true, played60: false, won: true } },
    { name: 'זופאריץ\'', points: -1, stats: { started: true, played60: false, won: false, conceded: 2 } }
  ]
};

async function fixSubOutPoints() {
  console.log('🔧 Setting exact points for subbed-out players in squad and subsOut...\n');

  for (const teamId of Object.keys(subOutFixes)) {
    const docRef = db.collection('users').doc(teamId);
    const snap = await docRef.get();
    if (!snap.exists) continue;

    const data = snap.data();
    const squad = data.squad || data.players || [];
    const published_subs_out = data.published_subs_out || [];
    const r5SubsOut = data.lineupsByRound?.['5']?.subsOut || [];

    const fixes = subOutFixes[teamId];

    const applyFixToPlayer = (p) => {
      const fix = fixes.find(f => isSamePlayer(f, p));
      if (fix) {
        return {
          ...p,
          points: fix.points,
          stats: fix.stats,
          isStarting: false
        };
      }
      return p;
    };

    const updatedSquad = squad.map(applyFixToPlayer);
    const updatedPublishedSubs = published_subs_out.map(applyFixToPlayer);
    const updatedR5Subs = r5SubsOut.map(applyFixToPlayer);

    const lineupsByRound = {
      ...(data.lineupsByRound || {}),
      '5': {
        ...(data.lineupsByRound?.['5'] || {}),
        subsOut: updatedR5Subs
      }
    };

    await docRef.update({
      squad: updatedSquad,
      players: updatedSquad,
      published_subs_out: updatedPublishedSubs,
      lineupsByRound
    });

    console.log(`  💾 Updated sub-out points for ${teamId}`);
  }

  console.log('\n🎉 DONE FIXING SUB-OUT PLAYER POINTS!');
}

fixSubOutPoints().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
