const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

const R1_STARTERS = {
  hamsili: ['מרציאנו', 'רביבו', 'לינדוויק', 'דרוויש', 'אצילי', 'גורה', 'בילו', 'סאנייה', "תורג'מן", 'וייסמן', "צ'יקו"],
  harale: ['גלזר', 'שלמה', 'מורזוב', 'שי בן דוד', 'מזרחי', 'רועי דוד', 'ברוניניו', 'דוידה', 'זלאטן', 'בואטנג', 'קאלו'],
  holonia: ['צור', 'אמאדור', 'סייף', 'גנדרני', 'שחר', 'אליאל', 'מוזי', 'וארלה', 'אלטמן', 'קליי', 'דון'],
  pichichi: ['מליקה', 'אנטויי', 'קוקו', 'דיופ', 'קאני', 'פרץ', 'קימבודי', 'ונטורה', 'רקאוניץ', 'נוביסי', 'אנסה'],
  tampa: ['טננבאום', 'קמארה', 'צונאמי', 'ליידנר', 'אווסו', 'אזולאי', 'בדש', 'זערורה', 'איסט', 'דאבו', 'שועה'],
  tumali: ['כץ', 'בטאיי', 'לייבו', 'מאיימבו', 'איתי רוטמן', 'חזן', 'יוספי', 'יהושע', 'טוריאל', 'סוקלר', 'אוגריסה']
};

// Points map per player from VAR updates in round 1
const R1_VAR_POINTS = {
  // hamsili
  'מרציאנו': 0, 'דרוויש': -1, 'גורה': 4, 'סאנייה': 1, 'לינדוויק': 1, 'קורטז': 2, 'רביבו': 10, 'בילו': 2, 'חוגי': 0,
  // harale
  'שי בן דוד': -1, 'ברוניניו': 14, 'רועי דוד': 2, 'גלזר': 3, 'אווסו': 2, 'שלמה': 1, 'דוידה': 5,
  // holonia
  'סייף': 3, 'קמפוס': 5, 'קליי': 2, 'שחר': 4, 'וארלה': 7,
  // pichichi
  'קאני': 7, 'קימבודי': 2, 'רקאוניץ': 8, 'עיאד חלאיילי': 2, 'מליקה': -2, 'פרץ': 19, 'קונטה': 6,
  // tampa
  'טננבאום': 0, 'צונאמי': 3, 'בדש': 2, 'אזולאי': 1, 'קמארה': 1, 'זערורה': 0, 'דאבו': 2,
  // tumali
  'בטאיי': 1, 'כץ': 1, 'לייבו': -1, 'חזן': 4, 'אוגריסה': 7, 'בן חמו': 2, 'סוקלר': 4, 'אבוחצירה': 0
};

const clean = s => String(s || '').toLowerCase().replace(/['"״׳`\-\s().]/g, '');

async function runRestoration() {
  console.log('Starting Round 1 Lineup Restoration...');
  const usersSnap = await db.collection('users').get();
  
  for (const docSnap of usersSnap.docs) {
    const teamId = docSnap.id;
    if (teamId === 'admin' || teamId === 'system') continue;
    
    const user = docSnap.data();
    const targetStartersNames = R1_STARTERS[teamId];
    if (!targetStartersNames) {
      console.log(`Skipping team ${teamId}: No preset Round 1 starters.`);
      continue;
    }

    const squad = user.squad || [];
    const lineup = [];
    const subsOut = [];

    squad.forEach(player => {
      const pNameClean = clean(player.name);
      const isStarter = targetStartersNames.some(sName => {
        const sClean = clean(sName);
        return pNameClean === sClean || pNameClean.includes(sClean) || sClean.includes(pNameClean);
      });

      const pts = R1_VAR_POINTS[player.name] !== undefined ? R1_VAR_POINTS[player.name] : (player.points || 0);

      const pObj = {
        ...player,
        points: pts,
        isStarting: isStarter
      };

      if (isStarter) {
        lineup.push(pObj);
      } else {
        subsOut.push(pObj);
      }
    });

    console.log(`Team ${teamId} (${user.teamName}): ${lineup.length} starters, ${subsOut.length} bench.`);
    
    await docSnap.ref.update({
      [`lineupsByRound.1`]: {
        lineup,
        subsOut,
        savedAt: new Date().toISOString()
      }
    });
  }

  console.log('✅ Round 1 lineups successfully restored into lineupsByRound.1!');
}

runRestoration().catch(console.error);
