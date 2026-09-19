const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function populatePredictorData() {
  console.log('Populating Round 2 Predictor Poll & Standings...');

  // 1. Save whatsapp_polls doc for Round 2
  await db.collection('whatsapp_polls').doc('round_2').set({
    round: 2,
    createdAt: new Date().toISOString(),
    matches: [
      { h: 'tumali', a: 'tampa', hName: 'תומאלי', aName: 'טמפה', actualWinner: 'a' },
      { h: 'hamsili', a: 'pichichi', hName: 'חמסילי', aName: 'פיציצי', actualWinner: 'a' },
      { h: 'harale', a: 'holonia', hName: 'חראלה', aName: 'חולוניה', actualWinner: 'h' }
    ],
    votes: {
      'harale': { 0: 'a', 1: 'a', 2: 'h', voterName: 'גיא (חראלה)' },
      'pichichi': { 0: 'a', 1: 'a', 2: 'h', voterName: 'פיציצי' },
      'tampa': { 0: 'a', 1: 'h', 2: 'h', voterName: 'טמפה' },
      'hamsili': { 0: 'h', 1: 'a', 2: 'h', voterName: 'אסף (חמסילי)' },
      'tumali': { 0: 'h', 1: 'a', 2: 'h', voterName: 'תומאלי' },
      'holonia': { 0: 'a', 1: 'h', 2: 'a', voterName: 'ארז (חולוניה)' }
    }
  });

  // 2. Save leagueData/predictor_standings
  await db.doc('leagueData/predictor_standings').set({
    lastUpdated: new Date().toISOString(),
    standings: [
      { name: 'חראלה (גיא)', hits: 3, points: 3, totalVotes: 3, accuracy: '100%' },
      { name: 'פיציצי', hits: 3, points: 3, totalVotes: 3, accuracy: '100%' },
      { name: 'טמפה', hits: 2, points: 2, totalVotes: 3, accuracy: '67%' },
      { name: 'חמסילי (אסף)', hits: 2, points: 2, totalVotes: 3, accuracy: '67%' },
      { name: 'תומאלי', hits: 2, points: 2, totalVotes: 3, accuracy: '67%' },
      { name: 'חולוניה (ארז)', hits: 1, points: 1, totalVotes: 3, accuracy: '33%' }
    ]
  });

  console.log('✅ Successfully populated whatsapp_polls and leagueData/predictor_standings!');
}

populatePredictorData().catch(console.error);
