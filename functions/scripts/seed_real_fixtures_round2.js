const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function seedRealFixturesRound2() {
  console.log('=== SEEDING REAL FIXTURES FOR ROUND 2 (29/08/2026 - 31/08/2026) ===\n');

  const fixSnap = await db.doc('leagueData/real_fixtures').get();
  const existingMatches = fixSnap.exists ? (fixSnap.data()?.matches || []) : [];

  const round2Matches = [
    { round: 2, date: '29/08/2026', time: '19:00', homeTeam: 'עירוני קרית שמונה', awayTeam: 'עירוני טבריה', competition: 'ליגת WINNER', stadium: 'נתניה', status: 'שיחק' },
    { round: 2, date: '29/08/2026', time: '19:30', homeTeam: 'הפועל פתח תקוה', awayTeam: 'הפועל ירושלים', competition: 'ליגת WINNER', stadium: 'שלמה ביטוח', status: 'שיחק' },
    { round: 2, date: '29/08/2026', time: '20:00', homeTeam: 'בני סכנין', awayTeam: 'מכבי פתח תקוה', competition: 'ליגת WINNER', stadium: 'עכו', status: 'שיחק' },
    { round: 2, date: '29/08/2026', time: '20:15', homeTeam: 'מכבי נתניה', awayTeam: 'בית"ר ירושלים', competition: 'ליגת WINNER', stadium: 'נתניה', status: 'שיחק' },
    { round: 2, date: '30/08/2026', time: '20:00', homeTeam: 'הפועל באר שבע', awayTeam: 'הפועל חדרה', competition: 'ליגת WINNER', stadium: 'טרנר', status: 'עתידי' },
    { round: 2, date: '30/08/2026', time: '20:15', homeTeam: 'מכבי תל אביב', awayTeam: 'מכבי בני ריינה', competition: 'ליגת WINNER', stadium: 'בלומפילד', status: 'עתידי' },
    { round: 2, date: '31/08/2026', time: '20:30', homeTeam: 'הפועל חיפה', awayTeam: 'מכבי חיפה', competition: 'ליגת WINNER', stadium: 'סמי עופר', status: 'עתידי' }
  ];

  // Merge round 2 matches with existing matches without duplicates
  const allMatches = [...existingMatches];
  round2Matches.forEach(m2 => {
    const exists = allMatches.some(m => m.round === m2.round && m.homeTeam === m2.homeTeam && m.awayTeam === m2.awayTeam);
    if (!exists) {
      allMatches.push(m2);
    }
  });

  await db.doc('leagueData/real_fixtures').set({
    matches: allMatches,
    lastUpdated: new Date().toISOString(),
    updatedBy: 'Round 2 Real Fixtures Seeder'
  }, { merge: true });

  console.log(`✅ Successfully seeded Round 2 real fixtures! Total real matches in DB: ${allMatches.length}`);
  process.exit(0);
}

seedRealFixturesRound2();
