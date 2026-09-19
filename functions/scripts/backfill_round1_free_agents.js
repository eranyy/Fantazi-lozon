const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

const cleanStr = (s) => String(s || '').toLowerCase().replace(/['"״׳`\-\s()]/g, '');

// Verified Round 1 Real League Free Agent Performance Data (Goalscorers & Assisters not in 6 fantasy squads)
const ROUND_1_FREE_AGENTS_PERFORMANCE = [
  { name: 'ירדן שועה', realTeam: 'בית"ר ירושלים', position: 'FWD', goals: 1, assists: 1, yellowCards: 0, redCards: 0, points: 10 },
  { name: 'גיא מלמד', realTeam: 'הפועל חיפה', position: 'FWD', goals: 1, assists: 0, yellowCards: 0, redCards: 0, points: 6 },
  { name: 'דיא סבע', realTeam: 'מכבי חיפה', position: 'MID', goals: 1, assists: 1, yellowCards: 0, redCards: 0, points: 10 },
  { name: 'איגור זלאטנוביץ\'', realTeam: 'מכבי נתניה', position: 'FWD', goals: 1, assists: 0, yellowCards: 0, redCards: 0, points: 6 },
  { name: 'איתמר שבירו', realTeam: 'מכבי נתניה', position: 'FWD', goals: 1, assists: 0, yellowCards: 0, redCards: 0, points: 6 },
  { name: 'סתיו טוריאל', realTeam: 'הפועל תל אביב', position: 'FWD', goals: 1, assists: 0, yellowCards: 0, redCards: 0, points: 6 },
  { name: 'אלכסנדר רמאלינגום', realTeam: 'בני סכנין', position: 'FWD', goals: 1, assists: 0, yellowCards: 0, redCards: 0, points: 6 },
  { name: 'מתנאל טאדסה', realTeam: 'בני סכנין', position: 'MID', goals: 0, assists: 1, yellowCards: 1, redCards: 0, points: 2 },
  { name: 'חמודי כנעאן', realTeam: 'מ.ס. אשדוד', position: 'MID', goals: 1, assists: 0, yellowCards: 0, redCards: 0, points: 6 },
  { name: 'סטניסלב בילנקי', realTeam: 'עירוני טבריה', position: 'FWD', goals: 1, assists: 0, yellowCards: 0, redCards: 0, points: 6 },
  { name: 'וואהב חביבאללה', realTeam: 'עירוני טבריה', position: 'FWD', goals: 0, assists: 1, yellowCards: 0, redCards: 0, points: 3 },
  { name: 'עאיד חבשי', realTeam: 'עירוני קרית שמונה', position: 'DEF', goals: 0, assists: 0, yellowCards: 1, redCards: 0, points: 1 }
];

async function backfillRound1FreeAgents() {
  console.log('=== BACKFILLING ROUND 1 FREE AGENTS STATS & POINTS ===');
  
  const batch = db.batch();
  let updatedCount = 0;

  for (const item of ROUND_1_FREE_AGENTS_PERFORMANCE) {
    const docId = cleanStr(item.name);
    const docRef = db.collection('real_league_players_scoring').doc(docId);

    batch.set(docRef, {
      id: docId,
      name: item.name,
      realTeam: item.realTeam,
      position: item.position,
      points: item.points,
      goals: item.goals,
      assists: item.assists,
      yellowCards: item.yellowCards,
      redCards: item.redCards,
      isDrafted: false,
      ownerTeam: null,
      ownerManager: null,
      updatedByScraper: true,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    updatedCount++;
  }

  await batch.commit();
  console.log(`Successfully backfilled ${updatedCount} free agents performance data from Round 1!`);
  process.exit(0);
}

backfillRound1FreeAgents();
