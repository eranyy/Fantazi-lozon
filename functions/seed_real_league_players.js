const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

const INITIAL_REAL_PLAYERS = [
  { id: 'yarden_shua', name: 'ירדן שועה', realTeam: 'בית"ר ירושלים', position: 'FWD', points: 8, goals: 1, assists: 1 },
  { id: 'dor_turgeman', name: 'דור תורג\'מן', realTeam: 'מכבי תל אביב', position: 'FWD', points: 5, goals: 1, assists: 0 },
  { id: 'eliel_peretz', name: 'אליאל פרץ', realTeam: 'הפועל באר שבע', position: 'MID', points: 8, goals: 1, assists: 1 },
  { id: 'luzon_sakler', name: 'סוקלר', realTeam: 'מכבי תל אביב', position: 'FWD', points: 5, goals: 1, assists: 0 },
  { id: 'varela', name: 'וארלה', realTeam: 'בית"ר ירושלים', position: 'MID', points: 7, goals: 1, assists: 0 },
  { id: 'broninho', name: 'ברוניניו', realTeam: 'מכבי חיפה', position: 'FWD', points: 14, goals: 2, assists: 1 },
  { id: 'dor_peretz', name: 'דור פרץ', realTeam: 'מכבי תל אביב', position: 'MID', points: 19, goals: 3, assists: 1 },
  { id: 'haziza', name: 'דולב חזיזה', realTeam: 'מכבי חיפה', position: 'MID', points: 6, goals: 0, assists: 2 },
  { id: 'guy_melamed', name: 'גיא מלמד', realTeam: 'הפועל חיפה', position: 'FWD', points: 10, goals: 2, assists: 0 },
  { id: 'din_david', name: 'דין דוד', realTeam: 'מכבי חיפה', position: 'FWD', points: 5, goals: 1, assists: 0 },
  { id: 'kings_kangwa', name: 'קינגס קאנגווה', realTeam: 'הפועל באר שבע', position: 'MID', points: 9, goals: 1, assists: 1 },
  { id: 'alessandru_matsan', name: 'אלכסנדרו מצרוני', realTeam: 'הפועל תל אביב', position: 'MID', points: 4, goals: 0, assists: 1 },
  { id: 'alonas_sefar', name: 'אלון תורג\'מן', realTeam: 'הפועל באר שבע', position: 'FWD', points: 5, goals: 1, assists: 0 },
  { id: 'omer_atzili', name: 'עומר אצילי', realTeam: 'בית"ר ירושלים', position: 'MID', points: 3, goals: 0, assists: 1 },
  { id: 'sagiv_jehezkel', name: 'שגיב יחזקאל', realTeam: 'מכבי תל אביב', position: 'DEF', points: 6, goals: 0, assists: 1 }
];

async function seedRealLeaguePlayers() {
  console.log('=== SEEDING REAL LEAGUE PLAYERS INTO FIRESTORE (real_league_players_scoring) ===');
  const batch = db.batch();

  INITIAL_REAL_PLAYERS.forEach(pl => {
    const ref = db.collection('real_league_players_scoring').doc(pl.id);
    batch.set(ref, {
      ...pl,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  });

  await batch.commit();
  console.log(`Successfully seeded ${INITIAL_REAL_PLAYERS.length} Israel Premier League players!`);
  process.exit(0);
}

seedRealLeaguePlayers();
