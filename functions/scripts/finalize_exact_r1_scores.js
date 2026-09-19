const admin = require('firebase-admin');

if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function finalizeExactR1Scores() {
  console.log('--- FINALIZING EXACT ROUND 1 SCORES FOR ALL TEAMS ---');

  const EXACT_TEAMS_R1 = {
    // חמסילי: 19 נקודות
    hamsili: [
      { name: 'מרציאנו', team: 'ב"ש', position: 'GK', points: 0 },
      { name: 'רביבו', team: 'מכבי ת"א', position: 'DEF', points: 10 },
      { name: 'לינדוויק', team: 'מכבי חיפה', position: 'DEF', points: 1 },
      { name: 'צ\'יקו', team: 'הפועל ת"א', position: 'DEF', points: 0 },
      { name: 'חוגי', team: 'הפועל ת"א', position: 'FWD', points: 0 }, // Subbed in for דרוויש (-1)
      { name: 'עומר אצילי', team: 'מכבי חיפה', position: 'MID', points: 0 },
      { name: 'גורה', team: 'מכבי חיפה', position: 'MID', points: 4 },
      { name: 'בילו', team: 'נתניה', position: 'MID', points: 2 },
      { name: 'קורטז', team: 'חמסילי', position: 'FWD', points: 2 }, // Subbed in for סאנייה (1)
      { name: 'תורג\'מן', team: 'הפועל חיפה', position: 'FWD', points: 0 },
      { name: 'וייסמן', team: 'בית"ר', position: 'FWD', points: 0 }
    ],

    // חראלה (גיא): 32 נקודות
    harale: [
      { name: 'גלזר', team: 'מכבי חיפה', position: 'GK', points: 3 },
      { name: 'מזרחי', team: 'הפועל בש', position: 'DEF', points: 4 },
      { name: 'שי בן דוד', team: 'קש', position: 'DEF', points: 3 },
      { name: 'שלמה', team: 'מכבי תא', position: 'DEF', points: 1 },
      { name: 'קארבלי', team: 'ביתר', position: 'FWD', points: 0 },
      { name: 'נועם כהן', team: 'הפועל חיפה', position: 'DEF', points: 0 },
      { name: 'רועי דוד', team: 'הפועל פת', position: 'MID', points: 2 },
      { name: 'ברוניניו', team: 'מכבי חיפה', position: 'MID', points: 14 },
      { name: 'דוידה', team: 'מכבי תא', position: 'MID', points: 5 },
      { name: 'אלקוקין', team: 'הפועל תא', position: 'MID', points: 0 },
      { name: 'בואטנג', team: 'הפועל תא', position: 'FWD', points: 0 }
    ],

    // תומאלי: 20 נקודות
    tumali: [
      { name: 'כץ', team: 'הפועל פ"ת', position: 'GK', points: 1 },
      { name: 'מאיימבו', team: 'הפועל ת"א', position: 'DEF', points: 0 },
      { name: 'איתי רוטמן', team: 'ב"ש', position: 'DEF', points: 0 },
      { name: 'לייבו', team: 'ק"ש', position: 'DEF', points: -1 },
      { name: 'בטאיי', team: 'מכבי חיפה', position: 'MID', points: 1 },
      { name: 'בן חמו', team: 'מכבי ת"א', position: 'MID', points: 2 },
      { name: 'חזן', team: 'מכבי פ"ת', position: 'MID', points: 4 },
      { name: 'טוריאל', team: 'הפועל ת"א', position: 'MID', points: 0 },
      { name: 'יהושע', team: 'ב"ש', position: 'MID', points: 0 },
      { name: 'סוקלר', team: 'מכבי ת"א', position: 'FWD', points: 6 },
      { name: 'אוגריסה', team: 'ק"ש', position: 'FWD', points: 7 }
    ],

    // טמפה: 17 נקודות
    tampa: [
      { name: 'טננבאום', team: 'ק"ש', position: 'GK', points: 0 },
      { name: 'צונאמי', team: 'מכבי חיפה', position: 'DEF', points: 3 },
      { name: 'קמארה', team: 'מכבי ת"א', position: 'DEF', points: 1 },
      { name: 'ליידנר', team: 'הפועל ת"א', position: 'DEF', points: 0 },
      { name: 'אווסו', team: 'הפועל ת"א', position: 'MID', points: 0 },
      { name: 'אזולאי', team: 'מכבי חיפה', position: 'MID', points: 1 },
      { name: 'דאבו', team: 'נתניה', position: 'MID', points: 5 },
      { name: 'זערורה', team: 'נתניה', position: 'MID', points: 0 },
      { name: 'שועה', team: 'בית"ר', position: 'FWD', points: 0 },
      { name: 'בדש', team: 'הפועל פ"ת', position: 'FWD', points: 2 },
      { name: 'איסט', team: 'באר שבע', position: 'FWD', points: 5 }
    ],

    // חולוניה: 24 נקודות
    holonia: [
      { name: 'צור', team: 'הפועל ת"א', position: 'GK', points: 0 },
      { name: 'אמאדור', team: 'ב"ש', position: 'DEF', points: 0 },
      { name: 'גנדרני', team: 'בית"ר', position: 'DEF', points: 0 },
      { name: 'סייף', team: 'מכבי חיפה', position: 'DEF', points: 3 },
      { name: 'שחר', team: 'מכבי ת"א', position: 'MID', points: 4 },
      { name: 'וארלה', team: 'מכבי ת"א', position: 'MID', points: 7 },
      { name: 'אליאל', team: 'ב"ש', position: 'MID', points: 8 },
      { name: 'מוזי', team: 'בית"ר', position: 'MID', points: 0 },
      { name: 'קליי', team: 'הפועל פ"ת', position: 'FWD', points: 2 },
      { name: 'עומרי אלטמן', team: 'הפועל ת"א', position: 'FWD', points: -5 },
      { name: 'קמפוס', team: 'הפועל רמת גן', position: 'FWD', points: 5 }
    ],

    // פיציצי: 40 נקודות
    pichichi: [
      { name: 'מליקה', team: 'מכבי ת"א', position: 'GK', points: -2 },
      { name: 'אנטויי', team: 'בית"ר', position: 'DEF', points: 0 },
      { name: 'קוקו', team: 'הפועל ת"א', position: 'DEF', points: 0 },
      { name: 'דיופ', team: 'ב"ש', position: 'DEF', points: 0 },
      { name: 'קונטה', team: 'נתניה', position: 'DEF', points: 6 },
      { name: 'קאני', team: 'מכבי חיפה', position: 'MID', points: 7 },
      { name: 'פרץ', team: 'מכבי ת"א', position: 'MID', points: 19 },
      { name: 'קימבודי', team: 'הפועל פ"ת', position: 'MID', points: 2 },
      { name: 'ונטורה', team: 'ב"ש', position: 'MID', points: 0 },
      { name: 'רקאוניץ', team: 'מכבי פ"ת', position: 'FWD', points: 8 },
      { name: 'אנסה', team: 'בית"ר', position: 'FWD', points: 0 }
    ]
  };

  for (const teamId of Object.keys(EXACT_TEAMS_R1)) {
    const lineup = EXACT_TEAMS_R1[teamId];
    const totalPts = lineup.reduce((s, p) => s + p.points, 0);

    const docRef = db.collection('users').doc(teamId);
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      const u = docSnap.data();
      const lByR = u.lineupsByRound || {};
      const r1Data = lByR[1] || {};

      await docRef.set({
        lineupsByRound: {
          ...lByR,
          1: {
            ...r1Data,
            lineup: lineup,
            totalPoints: totalPts
          }
        },
        published_lineup: lineup,
        lineup: lineup
      }, { merge: true });

      console.log(`✅ Team '${teamId}' Round 1 finalized with ${totalPts} points!`);
    }
  }

  console.log('\n🎉 ALL TEAMS ROUND 1 POINTS FULLY RESTORED & SYNCHRONIZED!');
}

finalizeExactR1Scores().catch(console.error);
