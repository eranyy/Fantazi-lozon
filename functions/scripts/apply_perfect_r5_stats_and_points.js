const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

const cleanStr = (s) => String(s || '').toLowerCase().replace(/['"״׳`\-\s()]/g, '');

const teamConfigs = {
  tumali: {
    name: 'תומאלי',
    targetScore: 48,
    starting: [
      { name: 'סילבה', position: 'GK', points: 6, stats: { started: true, played60: true, won: true, conceded: 1, yellow: false, red: false } },
      { name: 'בטאיי', position: 'DEF', points: 2, stats: { started: true, played60: true, won: true, conceded: 2, yellow: false, red: false } },
      { name: 'מאיימבו', position: 'DEF', points: 8, stats: { started: true, played60: true, won: true, cleanSheet: true, conceded: 0, yellow: false, red: false } },
      { name: 'קריצ\'אק', position: 'DEF', points: -1, stats: { started: true, played60: false, won: false, conceded: 2, yellow: false, red: false } },
      { name: 'אסנטה', position: 'DEF', points: 3, stats: { started: true, played60: true, won: true, conceded: 1, yellow: false, red: false } },
      { name: 'יוספי', position: 'MID', points: 7, stats: { started: true, played60: true, won: true, assists: 1, yellow: false, red: false } },
      { name: 'חזן', position: 'MID', points: 10, stats: { started: true, played60: true, won: false, goals: 1, assists: 1, yellow: false, red: false } },
      { name: 'ספר', position: 'MID', points: 4, stats: { started: true, played60: true, won: true, yellow: false, red: false } },
      { name: 'לייבו', position: 'DEF', points: 0, stats: { started: true, played60: false, won: false, conceded: 1, yellow: false, red: false } },
      { name: 'סוקלר', position: 'FWD', points: 6, stats: { started: true, played60: true, won: true, yellow: false, red: false } },
      { name: 'אוגריסה', position: 'FWD', points: 3, stats: { started: true, played60: false, won: true, yellow: false, red: false } }
    ],
    subs: [
      { playerOut: 'לייבו', playerIn: 'צילופיה', points: 0, stats: { started: false, played60: false, won: false } },
      { playerOut: 'קריצ\'א克', playerIn: 'אחמד', points: 0, stats: { started: false, played60: false, won: false } }
    ]
  },
  harale: {
    name: 'חראלה',
    targetScore: 41,
    starting: [
      { name: 'גלזר', position: 'GK', points: 0, stats: { started: true, played60: true, won: true, conceded: 2, yellow: true, red: false } },
      { name: 'שלמה', position: 'DEF', points: 3, stats: { started: true, played60: true, won: true, conceded: 1, yellow: false, red: false } },
      { name: 'מזרחי', position: 'DEF', points: 8, stats: { started: true, played60: true, won: true, cleanSheet: true, conceded: 0, yellow: false, red: false } },
      { name: 'קארבלי', position: 'DEF', points: -2, stats: { started: true, played60: false, won: true, ownGoals: 1, yellow: false, red: false } },
      { name: 'אלקוקין', position: 'MID', points: 6, stats: { started: true, played60: true, won: true, yellow: false, red: false } },
      { name: 'אוואסו 2', position: 'MID', points: 2, stats: { started: true, played60: true, won: false, yellow: false, red: false } },
      { name: 'רועי דוד', position: 'MID', points: 1, stats: { started: true, played60: false, won: false, yellow: false, red: false } },
      { name: 'ברוניניו', position: 'MID', points: 7, stats: { started: true, played60: true, won: true, assists: 1, yellow: false, red: false } },
      { name: 'דוידה', position: 'MID', points: 2, stats: { started: true, played60: true, won: true, yellow: true, red: false } },
      { name: 'אריק בילה', position: 'FWD', points: 1, stats: { started: true, played60: false, won: false, yellow: false, red: false } },
      { name: 'בואטנג', position: 'FWD', points: 9, stats: { started: true, played60: true, won: true, goals: 1, yellow: false, red: false } }
    ],
    subs: [
      { playerOut: 'אריק בילה', playerIn: 'קאלו', points: 2, stats: { started: false, played60: false, won: true } },
      { playerOut: 'רועי דוד', playerIn: 'זלאטן', points: 2, stats: { started: false, played60: false, won: true } }
    ]
  },
  pichichi: {
    name: 'פיצ\'יצ\'י',
    targetScore: 56,
    starting: [
      { name: 'ג\'ראפי', position: 'GK', points: 3, stats: { started: true, played60: true, won: false, conceded: 2, yellow: false, red: false } },
      { name: 'בן הרוש', position: 'DEF', points: 3, stats: { started: true, played60: true, won: true, conceded: 1, yellow: false, red: false } },
      { name: 'קוקו', position: 'DEF', points: 12, stats: { started: true, played60: true, won: true, cleanSheet: true, goals: 0, conceded: 0 } },
      { name: 'סבח', position: 'DEF', points: 0, stats: { started: true, played60: false, won: false, conceded: 1, yellow: false, red: false } },
      { name: 'פרץ', position: 'MID', points: 11, stats: { started: true, played60: true, won: true, goals: 1, yellow: false, red: false } },
      { name: 'קימבודי', position: 'MID', points: -3, stats: { started: true, played60: false, won: false, yellow: true, red: false } },
      { name: 'כנעאן', position: 'MID', points: 4, stats: { started: true, played60: true, won: true, yellow: false, red: false } },
      { name: 'רוטמן', position: 'MID', points: 2, stats: { started: true, played60: true, won: false, yellow: false, red: false } },
      { name: 'נובאקוביץ\'', position: 'FWD', points: 16, stats: { started: true, played60: true, won: true, goals: 2, yellow: false, red: false } },
      { name: 'נוביסי', position: 'FWD', points: 0, stats: { started: true, played60: true, won: false, yellow: true, red: false } },
      { name: 'אנסה', position: 'FWD', points: 8, stats: { started: true, played60: false, won: true, goals: 1, yellow: false, red: false } }
    ],
    subs: []
  },
  tampa: {
    name: 'טמפה',
    targetScore: 37,
    starting: [
      { name: 'ארליך', position: 'GK', points: -2, stats: { started: true, played60: true, won: false, conceded: 4, yellow: false, red: false } },
      { name: 'קמארה', position: 'DEF', points: -1, stats: { started: false, played60: false, won: false, conceded: 1, yellow: false, red: false } },
      { name: 'סלמן', position: 'FWD', points: 3, stats: { started: true, played60: false, won: true, yellow: false, red: false } },
      { name: 'נחמיאס', position: 'DEF', points: 6, stats: { started: true, played60: true, won: true, cleanSheet: true, yellow: true, red: false } },
      { name: 'יאניק', position: 'DEF', points: 12, stats: { started: true, played60: true, won: true, cleanSheet: true, yellow: false, red: false } },
      { name: 'אווסו', position: 'MID', points: 2, stats: { started: true, played60: true, won: true, yellow: true, red: false } },
      { name: 'זערורה', position: 'MID', points: 5, stats: { started: true, played60: true, won: false, assists: 1, yellow: false, red: false } },
      { name: 'גנאח', position: 'MID', points: 9, stats: { started: true, played60: true, won: true, goals: 1, yellow: false, red: false } },
      { name: 'אזולאי', position: 'MID', points: 2, stats: { started: true, played60: true, won: false, yellow: false, red: false } },
      { name: 'דאבו', position: 'FWD', points: 2, stats: { started: true, played60: true, won: false, yellow: false, red: false } },
      { name: 'פופ', position: 'FWD', points: 0, stats: { started: false, played60: false, won: false, yellow: false, red: false } }
    ],
    subs: [
      { playerOut: 'סלמן', playerIn: 'שועה', points: -1, stats: { started: false, played60: false, won: true, yellow: true } }
    ]
  },
  hamsili: {
    name: 'חמסילי',
    targetScore: 67,
    starting: [
      { name: 'מרציאנו', position: 'GK', points: 9, stats: { started: true, played60: true, won: true, cleanSheet: true, conceded: 0, yellow: false, red: false } },
      { name: 'צ\'יקו', position: 'DEF', points: 16, stats: { started: true, played60: true, won: true, cleanSheet: true, goals: 1, conceded: 0 } },
      { name: 'מנדי', position: 'DEF', points: -1, stats: { started: true, played60: false, won: false, conceded: 2, yellow: false, red: false } },
      { name: 'לינדוויק', position: 'DEF', points: 2, stats: { started: true, played60: false, won: true, conceded: 1, yellow: false, red: false } },
      { name: 'רונלדו טברנייר', position: 'DEF', points: 8, stats: { started: true, played60: true, won: true, goals: 1, conceded: 1, yellow: true } },
      { name: 'אצילי', position: 'MID', points: 14, stats: { started: true, played60: true, won: true, goals: 1, assists: 1, yellow: false, red: false } },
      { name: 'גורה', position: 'MID', points: 9, stats: { started: true, played60: true, won: true, goals: 1, yellow: false, red: false } },
      { name: 'בילו', position: 'MID', points: 5, stats: { started: true, played60: true, won: false, goals: 1, yellow: true, red: false } },
      { name: 'סלם', position: 'DEF', points: -2, stats: { started: true, played60: false, won: false, conceded: 3, yellow: false, red: false } },
      { name: 'תורג\'מן', position: 'FWD', points: 0, stats: { started: true, played60: true, won: false, yellow: true, red: false } },
      { name: 'וייסמן', position: 'FWD', points: 3, stats: { started: true, played60: false, won: true, yellow: false, red: false } }
    ],
    subs: [
      { playerOut: 'סלם', playerIn: 'פורסון', points: 2, stats: { started: false, played60: false, won: true } },
      { playerOut: 'מנדי', playerIn: 'יחזקאל', points: 2, stats: { started: false, played60: false, won: true } },
      { playerOut: 'לינדוויק', playerIn: 'מרדכי', points: 0, stats: { started: false, played60: false, won: false } }
    ]
  },
  holonia: {
    name: 'חולוניה',
    targetScore: 42,
    starting: [
      { name: 'צור', position: 'GK', points: 9, stats: { started: true, played60: true, won: true, cleanSheet: true, conceded: 0, yellow: false, red: false } },
      { name: 'גנדרני', position: 'DEF', points: 1, stats: { started: true, played60: true, won: true, conceded: 1, yellow: true, red: false } },
      { name: 'סייף', position: 'DEF', points: 0, stats: { started: true, played60: true, won: true, conceded: 2, yellow: true, red: false } },
      { name: 'אמאדור', position: 'DEF', points: 3, stats: { started: true, played60: false, won: true, conceded: 0, yellow: false, red: false } },
      { name: 'זופאריץ\'', position: 'DEF', points: -1, stats: { started: true, played60: false, won: false, conceded: 2, yellow: false, red: false } },
      { name: 'קמפוס', position: 'MID', points: 2, stats: { started: true, played60: true, won: false, yellow: false, red: false } },
      { name: 'וארלה', position: 'MID', points: 3, stats: { started: true, played60: false, won: true, yellow: false, red: false } },
      { name: 'קניקובסקי', position: 'MID', points: 4, stats: { started: true, played60: true, won: true, yellow: false, red: false } },
      { name: 'ברזאו', position: 'MID', points: 7, stats: { started: true, played60: true, won: true, assists: 1, yellow: false, red: false } },
      { name: 'אליאל', position: 'MID', points: 7, stats: { started: true, played60: true, won: true, assists: 1, yellow: false, red: false } },
      { name: 'אלטמן', position: 'FWD', points: 3, stats: { started: true, played60: false, won: true, yellow: false, red: false } }
    ],
    subs: [
      { playerOut: 'אלטמן', playerIn: 'דאפה', points: 2, stats: { started: false, played60: false, won: true } },
      { playerOut: 'וארלה', playerIn: 'מדמון', points: 0, stats: { started: false, played60: false, won: true, yellow: true } },
      { playerOut: 'זופאריץ\'', playerIn: 'מוזי', points: 2, stats: { started: false, played60: false, won: true } }
    ]
  }
};

async function applyPerfectR5Data() {
  console.log('🚀 Applying Perfect Round 5 Stats and Points for All 6 Teams...\n');

  for (const teamId of Object.keys(teamConfigs)) {
    const config = teamConfigs[teamId];
    console.log(`=== Processing ${teamId} (${config.name}) ===`);

    const docRef = db.collection('users').doc(teamId);
    const snap = await docRef.get();
    if (!snap.exists) continue;

    const data = snap.data();
    const squad = data.squad || data.players || [];

    const findInSquad = (nameStr) => {
      const cSearch = cleanStr(nameStr);
      return squad.find(p => {
        const cP = cleanStr(p.name || p.player);
        return cP && (cP === cSearch || cP.includes(cSearch) || cSearch.includes(cP));
      });
    };

    // 1. Prepare starting lineup
    let startingLineup = config.starting.map(item => {
      const found = findInSquad(item.name);
      return {
        ...(found || {}),
        name: item.name,
        position: item.position || found?.position || 'MID',
        points: item.points,
        stats: item.stats,
        isStarting: true
      };
    });

    // 2. Prepare sub logs and sub objects
    let subLogs = [];
    config.subs.forEach((s, idx) => {
      subLogs.push({
        id: `sub_r5_${teamId}_${idx}_${Date.now()}`,
        type: 'HALFTIME_SUB',
        round: 5,
        playerOut: s.playerOut,
        playerIn: s.playerIn,
        status: 'ACTIVE',
        actionBy: 'אדמין (אקסל ידני)',
        timestamp: new Date().toLocaleString('he-IL', { hour12: false })
      });

      const foundIn = findInSquad(s.playerIn);
      if (foundIn) {
        foundIn.points = s.points;
        foundIn.stats = s.stats;
      }
    });

    const currentTransfers = (data.transfers || []).filter(t => !t || Number(t.round) !== 5 || !t.type || !t.type.includes('HALFTIME'));
    const newTransfers = [...currentTransfers, ...subLogs];

    // 3. Prepare full squad
    const updatedSquad = squad.map(sp => {
      const inStarting = startingLineup.find(lp => cleanStr(lp.name) === cleanStr(sp.name));
      if (inStarting) return inStarting;

      const inSub = config.subs.find(sb => cleanStr(sb.playerIn) === cleanStr(sp.name));
      if (inSub) {
        return {
          ...sp,
          points: inSub.points,
          stats: inSub.stats,
          isStarting: false
        };
      }

      return { ...sp, points: 0, stats: {}, isStarting: false };
    });

    // 4. Save lineupsByRound['5']
    const lineupsByRound = {
      ...(data.lineupsByRound || {}),
      '5': {
        lineup: startingLineup,
        subsOut: updatedSquad.filter(sp => !startingLineup.some(lp => cleanStr(lp.name) === cleanStr(sp.name))),
        savedAt: new Date().toISOString()
      }
    };

    // 5. Update Firestore
    await docRef.update({
      published_lineup: startingLineup,
      lineup: startingLineup,
      published_subs_out: updatedSquad.filter(sp => !startingLineup.some(lp => cleanStr(lp.name) === cleanStr(sp.name))),
      squad: updatedSquad,
      players: updatedSquad,
      transfers: newTransfers,
      lineupsByRound
    });

    console.log(`  ✅ Successfully updated Firestore for ${teamId}`);
  }

  console.log('\n🎉 ALL 6 TEAMS PERFECTLY UPDATED IN FIRESTORE!');
}

applyPerfectR5Data().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
