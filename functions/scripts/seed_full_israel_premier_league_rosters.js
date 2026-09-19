const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

const cleanStr = (s) => String(s || '').toLowerCase().replace(/['"״׳`\-\s()]/g, '');

// Comprehensive roster of active Israel Premier League players (2026/2027 season)
const REAL_LEAGUE_ROSTERS = [
  // מכבי תל אביב
  { name: 'ערן זהבי', realTeam: 'מכבי תל אביב', position: 'FWD' },
  { name: 'דור תורג\'מן', realTeam: 'מכבי תל אביב', position: 'FWD' },
  { name: 'אלעד מדמון', realTeam: 'מכבי תל אביב', position: 'FWD' },
  { name: 'השאם לאיוס', realTeam: 'מכבי תל אביב', position: 'MID' },
  { name: 'גבי קניקובסקי', realTeam: 'מכבי תל אביב', position: 'MID' },
  { name: 'איסוף סיסוקו', realTeam: 'מכבי תל אביב', position: 'MID' },
  { name: 'עידו שחר', realTeam: 'מכבי תל אביב', position: 'MID' },
  { name: 'אופיר דוידזאדה', realTeam: 'מכבי תל אביב', position: 'DEF' },
  { name: 'שגיב יחזקאל', realTeam: 'מכבי תל אביב', position: 'DEF' },
  { name: 'רז שלמה', realTeam: 'מכבי תל אביב', position: 'DEF' },
  { name: 'נמניה סטואיץ\'', realTeam: 'מכבי תל אביב', position: 'DEF' },
  { name: 'רועי משפתי', realTeam: 'מכבי תל אביב', position: 'GK' },
  { name: 'אופק מליקה', realTeam: 'מכבי תל אביב', position: 'GK' },

  // מכבי חיפה
  { name: 'דין דוד', realTeam: 'מכבי חיפה', position: 'FWD' },
  { name: 'פרנצדי פיירו', realTeam: 'מכבי חיפה', position: 'FWD' },
  { name: 'עומר אצילי', realTeam: 'מכבי חיפה', position: 'MID' },
  { name: 'דיא סבע', realTeam: 'מכבי חיפה', position: 'MID' },
  { name: 'ליאור רפאלוב', realTeam: 'מכבי חיפה', position: 'MID' },
  { name: 'ענאן חלאילי', realTeam: 'מכבי חיפה', position: 'MID' },
  { name: "מחמוד ג'אבר", realTeam: 'מכבי חיפה', position: 'MID' },
  { name: 'עלי מוחמד', realTeam: 'מכבי חיפה', position: 'MID' },
  { name: 'גוני נאור', realTeam: 'מכבי חיפה', position: 'MID' },
  { name: 'פייר קורנו', realTeam: 'מכבי חיפה', position: 'DEF' },
  { name: 'שון גולדברג', realTeam: 'מכבי חיפה', position: 'DEF' },
  { name: 'עבדולאי סק', realTeam: 'מכבי חיפה', position: 'DEF' },
  { name: 'עילאי פיינגולד', realTeam: 'מכבי חיפה', position: 'DEF' },
  { name: 'שריף כיוף', realTeam: 'מכבי חיפה', position: 'GK' },
  { name: 'רועי פוקס', realTeam: 'מכבי חיפה', position: 'GK' },

  // הפועל באר שבע
  { name: 'אלון תורג\'מן', realTeam: 'הפועל באר שבע', position: 'FWD' },
  { name: 'ארתור שושנאצ\'ב', realTeam: 'הפועל באר שבע', position: 'FWD' },
  { name: 'זאהי אחמד', realTeam: 'הפועל באר שבע', position: 'FWD' },
  { name: 'אמיר גנאח', realTeam: 'הפועל באר שבע', position: 'MID' },
  { name: 'רותם חטואל', realTeam: 'הפועל באר שבע', position: 'MID' },
  { name: 'קינגס קאנגווה', realTeam: 'הפועל באר שבע', position: 'MID' },
  { name: 'רועי גורדנה', realTeam: 'הפועל באר שבע', position: 'MID' },
  { name: 'שי אליאס', realTeam: 'הפועל באר שבע', position: 'MID' },
  { name: 'אנטוניו ספר', realTeam: 'הפועל באר שבע', position: 'MID' },
  { name: 'מיגל ויטור', realTeam: 'הפועל באר שבע', position: 'DEF' },
  { name: 'איתן טיבי', realTeam: 'הפועל באר שבע', position: 'DEF' },
  { name: 'הלדר לופס', realTeam: 'הפועל באר שבע', position: 'DEF' },
  { name: 'גיא מזרחי', realTeam: 'הפועל באר שבע', position: 'DEF' },
  { name: 'אופיר מרציאנו', realTeam: 'הפועל באר שבע', position: 'GK' },
  { name: 'ניב אליאסי', realTeam: 'הפועל באר שבע', position: 'GK' },

  // בית"ר ירושלים
  { name: 'ירדן שועה', realTeam: 'בית"ר ירושלים', position: 'FWD' },
  { name: 'מיירון ג\'ורג\'', realTeam: 'בית"ר ירושלים', position: 'FWD' },
  { name: 'נהוראי דבוש', realTeam: 'בית"ר ירושלים', position: 'FWD' },
  { name: 'עדי יונה', realTeam: 'בית"ר ירושלים', position: 'MID' },
  { name: 'איסמעילה סורו', realTeam: 'בית"ר ירושלים', position: 'MID' },
  { name: 'דור מיכה', realTeam: 'בית"ר ירושלים', position: 'MID' },
  { name: 'ירין לוי', realTeam: 'בית"ר ירושלים', position: 'MID' },
  { name: 'פילטר מורוזוב', realTeam: 'בית"ר ירושלים', position: 'DEF' },
  { name: 'אורי דהן', realTeam: 'בית"ר ירושלים', position: 'DEF' },
  { name: 'גיל כהן', realTeam: 'בית"ר ירושלים', position: 'DEF' },
  { name: 'מיגל סילבה', realTeam: 'בית"ר ירושלים', position: 'GK' },

  // הפועל חיפה
  { name: 'גיא מלמד', realTeam: 'הפועל חיפה', position: 'FWD' },
  { name: 'איתמר נוי', realTeam: 'הפועל חיפה', position: 'MID' },
  { name: 'נאור סבג', realTeam: 'הפועל חיפה', position: 'MID' },
  { name: 'דור מלול', realTeam: 'הפועל חיפה', position: 'DEF' },
  { name: 'פרנאן מאיימבו', realTeam: 'הפועל חיפה', position: 'DEF' },
  { name: 'אורן ביטון', realTeam: 'הפועל חיפה', position: 'DEF' },
  { name: 'ניב אנטמן', realTeam: 'הפועל חיפה', position: 'GK' },
  { name: 'יואב ג\'ראפי', realTeam: 'הפועל חיפה', position: 'GK' },

  // מכבי נתניה
  { name: 'איגור זלאטנוביץ\'', realTeam: 'מכבי נתניה', position: 'FWD' },
  { name: 'איתמר שבירו', realTeam: 'מכבי נתניה', position: 'FWD' },
  { name: 'עוז בילו', realTeam: 'מכבי נתניה', position: 'MID' },
  { name: 'מאור לוי', realTeam: 'מכבי נתניה', position: 'MID' },
  { name: 'בר כהן', realTeam: 'מכבי נתניה', position: 'MID' },
  { name: 'רותם קלר', realTeam: 'מכבי נתניה', position: 'DEF' },
  { name: 'כארם ג\'אבר', realTeam: 'מכבי נתניה', position: 'DEF' },
  { name: 'עומר ניראון', realTeam: 'מכבי נתניה', position: 'GK' },

  // הפועל תל אביב
  { name: 'סתיו טוריאל', realTeam: 'הפועל תל אביב', position: 'FWD' },
  { name: 'עומרי אלטמן', realTeam: 'הפועל תל אביב', position: 'FWD' },
  { name: 'רן בנימין', realTeam: 'הפועל תל אביב', position: 'MID' },
  { name: 'אל ים קנצפולסקי', realTeam: 'הפועל תל אביב', position: 'MID' },
  { name: 'זיו מורגן', realTeam: 'הפועל תל אביב', position: 'DEF' },
  { name: 'אור בלוריאן', realTeam: 'הפועל תל אביב', position: 'DEF' },
  { name: 'רובי לבקוביץ\'', realTeam: 'הפועל תל אביב', position: 'GK' },

  // בני סכנין
  { name: 'אלכסנדר רמאלינגום', realTeam: 'בני סכנין', position: 'FWD' },
  { name: 'מתנאל טאדסה', realTeam: 'בני סכנין', position: 'MID' },
  { name: 'סטפן אומונגה', realTeam: 'בני סכנין', position: 'MID' },
  { name: 'חאסן חילו', realTeam: 'בני סכנין', position: 'DEF' },
  { name: 'מוחמד אבו ניל', realTeam: 'בני סכנין', position: 'GK' },

  // מועדון ספורט אשדוד
  { name: 'שלומי אזולאי', realTeam: 'מ.ס. אשדוד', position: 'FWD' },
  { name: 'חמודי כנעאן', realTeam: 'מ.ס. אשדוד', position: 'MID' },
  { name: 'אילאי טמם', realTeam: 'מ.ס. אשדוד', position: 'MID' },
  { name: 'טימוטי אוואני', realTeam: 'מ.ס. אשדוד', position: 'DEF' },
  { name: 'אריאל הרוש', realTeam: 'מ.ס. אשדוד', position: 'GK' },

  // מכבי פתח תקוה
  { name: 'אנס מוחמד', realTeam: 'מכבי פתח תקוה', position: 'FWD' },
  { name: 'עידן טוקלומטי', realTeam: 'מכבי פתח תקוה', position: 'MID' },
  { name: 'מאור לוי', realTeam: 'מכבי פתח תקוה', position: 'MID' },
  { name: 'אביב סלם', realTeam: 'מכבי פתח תקוה', position: 'DEF' },
  { name: 'מרקו וולף', realTeam: 'מכבי פתח תקוה', position: 'GK' },

  // עירוני טבריה
  { name: 'סטניסלב בילנקי', realTeam: 'עירוני טבריה', position: 'FWD' },
  { name: 'וואהב חביבאללה', realTeam: 'עירוני טבריה', position: 'FWD' },
  { name: 'שי קונסטנטין', realTeam: 'עירוני טבריה', position: 'DEF' },
  { name: 'דניאל טננבאום', realTeam: 'עירוני טבריה', position: 'GK' },

  // עירוני קרית שמונה
  { name: "ז'ארדל", realTeam: 'עירוני קרית שמונה', position: 'FWD' },
  { name: 'אלפרדו סטיבנס', realTeam: 'עירוני קרית שמונה', position: 'FWD' },
  { name: 'סקו באנגורה', realTeam: 'עירוני קרית שמונה', position: 'MID' },
  { name: 'עאיד חבשי', realTeam: 'עירוני קרית שמונה', position: 'DEF' },
  { name: 'מתן זלמנוביץ\'', realTeam: 'עירוני קרית שמונה', position: 'GK' }
];

async function seedFullPremierLeagueRosters() {
  console.log('=== SEEDING FULL ISRAEL PREMIER LEAGUE ROSTERS & MATCHING DRAFTS ===');
  
  // 1. Fetch all drafted players from Fantasy Luzon managers
  const usersSnap = await db.collection('users').get();
  const draftedMap = new Map(); // normName -> { team, manager, originalName }

  usersSnap.docs.forEach(uDoc => {
    const u = uDoc.data();
    if (u.teamName === 'ADMIN' || u.name === 'ADMIN') return;

    const squad = u.squad || u.players || u.published_lineup || u.lineup || [];
    const teamName = u.teamName || u.name || uDoc.id;
    const managerName = u.manager || u.assistantName || 'מנג\'ר';

    if (Array.isArray(squad)) {
      squad.forEach(pl => {
        if (!pl || !pl.name) return;
        const normKey = cleanStr(pl.name);
        draftedMap.set(normKey, {
          team: teamName,
          manager: managerName,
          originalName: pl.name,
          position: pl.position || 'MID',
          points: Number(pl.points) || 0,
          realTeam: pl.team || pl.realTeam || 'ליגת WINNER'
        });
      });
    }
  });

  console.log(`Found ${draftedMap.size} drafted players across 6 managers.`);

  // 2. Combine drafted players AND all real league rosters
  const allPlayersMap = new Map();

  // First, add all drafted players
  draftedMap.forEach((info, key) => {
    allPlayersMap.set(key, {
      id: key,
      name: info.originalName,
      realTeam: info.realTeam,
      position: info.position,
      points: info.points,
      isDrafted: true,
      ownerTeam: info.team,
      ownerManager: info.manager
    });
  });

  // Second, add all real league players (unpicked free agents)
  REAL_LEAGUE_ROSTERS.forEach(pl => {
    const normKey = cleanStr(pl.name);
    
    // Check if this real league player is drafted by any manager using fuzzy lookup
    let draftMatch = draftedMap.get(normKey);
    if (!draftMatch) {
      for (const [k, v] of draftedMap.entries()) {
        if (k.length >= 3 && (normKey.includes(k) || k.includes(normKey))) {
          draftMatch = v;
          break;
        }
      }
    }

    if (draftMatch) {
      allPlayersMap.set(normKey, {
        id: normKey,
        name: pl.name,
        realTeam: pl.realTeam,
        position: pl.position,
        points: draftMatch.points || 0,
        isDrafted: true,
        ownerTeam: draftMatch.team,
        ownerManager: draftMatch.manager
      });
    } else {
      // Unpicked Free Agent in Israel Premier League!
      allPlayersMap.set(normKey, {
        id: normKey,
        name: pl.name,
        realTeam: pl.realTeam,
        position: pl.position,
        points: 0,
        isDrafted: false,
        ownerTeam: null,
        ownerManager: null
      });
    }
  });

  console.log(`Total real league players to seed: ${allPlayersMap.size}`);

  // 3. Write to Firestore in batches
  const batch = db.batch();
  let count = 0;
  let freeCount = 0;
  let draftedCount = 0;

  allPlayersMap.forEach((player, docId) => {
    const ref = db.collection('real_league_players_scoring').doc(docId);
    batch.set(ref, {
      ...player,
      goals: 0,
      assists: 0,
      yellowCards: 0,
      redCards: 0,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    count++;
    if (player.isDrafted) draftedCount++;
    else freeCount++;
  });

  await batch.commit();
  console.log(`SUCCESS! Seeded ${count} total Premier League players (${draftedCount} drafted, ${freeCount} FREE AGENTS) to real_league_players_scoring!`);
  process.exit(0);
}

seedFullPremierLeagueRosters();
