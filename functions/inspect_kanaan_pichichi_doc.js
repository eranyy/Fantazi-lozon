const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function inspectPichichiDoc() {
  console.log('=== INSPECTING PICHICHI DOC FOR KANA\'AN ("כנעאן") ===\n');

  const pichichiSnap = await db.collection('users').doc('pichichi').get();
  if (pichichiSnap.exists) {
    const data = pichichiSnap.data();
    console.log('Pichichi team manager:', data.manager);

    const lineup = data.lineup || [];
    const published = data.published_lineup || [];
    const r2Lineup = data.lineupsByRound && data.lineupsByRound[2] ? data.lineupsByRound[2].lineup || [] : [];

    const kanaanInLineup = lineup.find(p => p.name.includes('כנעאן') || p.name.includes('כנען'));
    const kanaanInPublished = published.find(p => p.name.includes('כנעאן') || p.name.includes('כנען'));
    const kanaanInR2 = r2Lineup.find(p => p.name.includes('כנעאן') || p.name.includes('כנען'));

    console.log('Kanaan in lineup:', kanaanInLineup ? { name: kanaanInLineup.name, pts: kanaanInLineup.points, stats: kanaanInLineup.stats } : 'NOT FOUND');
    console.log('Kanaan in published_lineup:', kanaanInPublished ? { name: kanaanInPublished.name, pts: kanaanInPublished.points, stats: kanaanInPublished.stats } : 'NOT FOUND');
    console.log('Kanaan in lineupsByRound[2]:', kanaanInR2 ? { name: kanaanInR2.name, pts: kanaanInR2.points, stats: kanaanInR2.stats } : 'NOT FOUND');
  }

  process.exit(0);
}

inspectPichichiDoc();
