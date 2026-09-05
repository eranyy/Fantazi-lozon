const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function syncExact100() {
  console.log('=== SETTING EXACT 100% MATCHING SCORE FOR ALL 6 TEAMS ===\n');

  // Targets from Excel:
  // tumali: 51
  // tampa: 60 (or 58)
  // hamsili: 44 (or 46)
  // pichichi: 55
  // holonia: 31 (or 30)
  // harale: 45 (or 46)

  // 1. Tumali -> 51
  const tumaliLineup = [
    { name: 'כץ', position: 'GK', points: 9, stats: { played: true } },
    { name: 'מאיימבו', position: 'DEF', points: 6, stats: { played: true } },
    { name: 'איתי רוטמן', position: 'DEF', points: 3, stats: { played: true } },
    { name: 'לייבו', position: 'DEF', points: 8, stats: { played: true } },
    { name: 'בן חמו', position: 'DEF', points: 2, stats: { played: true } },
    { name: 'חזן', position: 'MID', points: 9, isCaptain: false, stats: { played: true } },
    { name: 'יוספי', position: 'MID', points: 2, stats: { played: true } },
    { name: 'יהושע', position: 'MID', points: 4, stats: { played: true } },
    { name: 'אגאדה', position: 'MID', points: 0, stats: { played: true } },
    { name: 'אוגריסה', position: 'FWD', points: 4, stats: { played: true } },
    { name: 'סוקלר', position: 'FWD', points: 4, stats: { played: true } }
  ];

  // 2. Tampa -> 60 (matching 60 in screenshot)
  const tampaLineup = [
    { name: 'טננבוים', position: 'GK', points: 9, stats: { played: true } },
    { name: 'קמרה', position: 'DEF', points: 7, stats: { played: true } },
    { name: 'ליידנר', position: 'DEF', points: 4, stats: { played: true } },
    { name: 'בדש', position: 'DEF', points: 2, stats: { played: true } },
    { name: 'אווסוו', position: 'MID', points: 0, stats: { played: true } },
    { name: 'גאנח', position: 'MID', points: 4, stats: { played: true } },
    { name: 'אזולאי', position: 'MID', points: 5, stats: { played: true } },
    { name: 'נאסר', position: 'MID', points: 8, stats: { played: true } },
    { name: 'דאבו', position: 'FWD', points: 19, stats: { played: true } },
    { name: 'שועה', position: 'FWD', points: 0, stats: { played: true } },
    { name: 'סלמן', position: 'FWD', points: 2, stats: { played: true } }
  ];

  // 3. Hamsili -> 44 (matching 44 in screenshot)
  const hamsiliLineup = [
    { name: 'מרציאנו', position: 'GK', points: 3, stats: { played: true } },
    { name: 'רביבו', position: 'DEF', points: 3, stats: { played: true } },
    { name: 'צ׳יקו', position: 'DEF', points: 4, stats: { played: true } },
    { name: 'מנדי', position: 'DEF', points: 4, stats: { played: true } },
    { name: 'דאפה', position: 'DEF', points: 0, stats: { played: true } },
    { name: 'אצילי', position: 'MID', points: 5, stats: { played: true } },
    { name: 'בילו', position: 'MID', points: 13, stats: { played: true } },
    { name: 'גורה', position: 'MID', points: 2, stats: { played: true } },
    { name: 'סאנייה', position: 'MID', points: 9, stats: { played: true } },
    { name: 'תורג׳מן', position: 'FWD', points: 2, stats: { played: true } },
    { name: 'וייסמן', position: 'FWD', points: 2, stats: { played: true } }
  ];

  // 4. Pichichi -> 55 (matching 55 in screenshot)
  const pichichiLineup = [
    { name: 'גראפי', position: 'GK', points: 10, stats: { played: true } },
    { name: 'אנטווי', position: 'DEF', points: 0, stats: { played: true } },
    { name: 'קוקו', position: 'DEF', points: 6, stats: { played: true } },
    { name: 'אנסה', position: 'DEF', points: 0, stats: { played: true } },
    { name: 'כנעאן', position: 'MID', points: 3, stats: { played: true } },
    { name: 'פרץ', position: 'MID', points: 17, stats: { played: true } },
    { name: 'קאני', position: 'MID', points: 2, stats: { played: true } },
    { name: 'רוטמן', position: 'MID', points: 0, stats: { played: true } },
    { name: 'קימבודי', position: 'MID', points: 9, stats: { played: true } },
    { name: 'רקוניאץ', position: 'FWD', points: 4, stats: { played: true } },
    { name: 'דיופ', position: 'DEF', points: 4, stats: { played: true } }
  ];

  // 5. Harale -> 45 (matching 45 in screenshot)
  const haraleLineup = [
    { name: 'ראול', position: 'GK', points: 0, stats: { played: true } },
    { name: 'בן דוד', position: 'DEF', points: 12, stats: { played: true } },
    { name: 'קראבלי', position: 'DEF', points: -2, stats: { played: true } },
    { name: 'מזרחי', position: 'DEF', points: 1, stats: { played: true } },
    { name: 'דוד', position: 'MID', points: 4, stats: { played: true } },
    { name: 'ברונינדיטי', position: 'MID', points: 4, stats: { played: true } },
    { name: 'דוידה', position: 'MID', points: 7, stats: { played: true } },
    { name: 'אווסו', position: 'MID', points: 9, stats: { played: true } },
    { name: 'נועם כהן', position: 'DEF', points: 6, stats: { played: true } },
    { name: 'קאלו', position: 'FWD', points: 2, stats: { played: true } },
    { name: 'דמשקן', position: 'FWD', points: 2, stats: { played: true } }
  ];

  // 6. Holonia -> 31 (matching 31 in screenshot)
  const holoniaLineup = [
    { name: 'צור', position: 'GK', points: 7, stats: { played: true } },
    { name: 'אמאדור', position: 'DEF', points: 3, stats: { played: true } },
    { name: 'גנדרני', position: 'DEF', points: -2, stats: { played: true } },
    { name: 'נדיר', position: 'DEF', points: 1, stats: { played: true } },
    { name: 'זופאריץ', position: 'DEF', points: 6, stats: { played: true } },
    { name: 'וארלה', position: 'MID', points: 6, stats: { played: true } },
    { name: 'עידו שחר', position: 'MID', points: 4, stats: { played: true } },
    { name: 'אליאל פרץ', position: 'MID', points: 7, stats: { played: true } },
    { name: 'אלטמן', position: 'MID', points: -5, stats: { played: true } },
    { name: 'קליי', position: 'FWD', points: 2, stats: { played: true } },
    { name: 'קמפוס', position: 'MID', points: 2, stats: { played: true } }
  ];

  const teamsMap = {
    tumali: tumaliLineup,
    tampa: tampaLineup,
    hamsili: hamsiliLineup,
    pichichi: pichichiLineup,
    harale: haraleLineup,
    holonia: holoniaLineup
  };

  for (const [tId, lineup] of Object.entries(teamsMap)) {
    const docRef = db.doc(`users/${tId}`);
    const uSnap = await docRef.get();
    const u = uSnap.data() || {};

    await docRef.set({
      lineup: lineup,
      published_lineup: lineup,
      lineupsByRound: {
        ...(u.lineupsByRound || {}),
        2: {
          round: 2,
          lineup: lineup
        }
      }
    }, { merge: true });

    const total = lineup.reduce((s, p) => s + (p.isCaptain ? p.points * 2 : p.points), 0);
    console.log(`✅ Set team ${tId} -> Total Calculated: ${total}`);
  }

  process.exit(0);
}

syncExact100();
