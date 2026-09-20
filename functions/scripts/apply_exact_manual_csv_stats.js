const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

const cleanStr = (s) => String(s || '').toLowerCase().replace(/['"״׳`\-\s()]/g, '');

const csvFullData = {
  tumali: {
    name: 'תומאלי',
    targetScore: 48,
    players: [
      { name: 'סילבה', position: 'GK', p: 1, p60: 1, w: 2, c: -1, g: 0, a: 0, y: 0, r: 0, pnc: 3, total: 6 },
      { name: 'בטאיי', position: 'DEF', p: 1, p60: 1, w: 2, c: -2, g: 0, a: 0, y: 0, r: 0, pnc: 0, total: 2 },
      { name: 'מאיימבו', position: 'DEF', p: 1, p60: 1, w: 2, c: 4, g: 0, a: 0, y: 0, r: 0, pnc: 0, total: 8 },
      { name: 'קריצ\'אק', position: 'DEF', p: 1, p60: 0, w: 0, c: -2, g: 0, a: 0, y: 0, r: 0, pnc: 0, total: -1 },
      { name: 'אסנטה', position: 'DEF', p: 1, p60: 1, w: 2, c: -1, g: 0, a: 0, y: 0, r: 0, pnc: 0, total: 3 },
      { name: 'יוספי', position: 'MID', p: 1, p60: 1, w: 2, c: 0, g: 0, a: 3, y: 0, r: 0, pnc: 0, total: 7 },
      { name: 'חזן', position: 'MID', p: 1, p60: 1, w: 0, c: 0, g: 5, a: 3, y: 0, r: 0, pnc: 0, total: 10 },
      { name: 'ספר', position: 'MID', p: 1, p60: 1, w: 2, c: 0, g: 0, a: 0, y: 0, r: 0, pnc: 0, total: 4 },
      { name: 'לייבו', position: 'DEF', p: 1, p60: 0, w: 0, c: -1, g: 0, a: 0, y: 0, r: 0, pnc: 0, total: 0 },
      { name: 'סוקלר', position: 'FWD', p: 1, p60: 1, w: 2, c: 0, g: 0, a: 0, y: 0, r: 0, pnc: 2, total: 6 },
      { name: 'אוגריסה', position: 'FWD', p: 1, p60: 0, w: 2, c: 0, g: 0, a: 0, y: 0, r: 0, pnc: 0, total: 3 }
    ],
    subs: [
      { playerOut: 'לייבו', playerIn: 'צילופיה', p: 0, p60: 0, w: 0, c: 0, g: 0, a: 0, y: 0, r: 0, pnc: 0, total: 0 },
      { playerOut: 'קריצ\'אק', playerIn: 'אחמד', p: 0, p60: 0, w: 0, c: 0, g: 0, a: 0, y: 0, r: 0, pnc: 0, total: 0 }
    ]
  },
  harale: {
    name: 'חראלה',
    targetScore: 41,
    players: [
      { name: 'גלזר', position: 'GK', p: 1, p60: 1, w: 2, c: -2, g: 0, a: 0, y: -2, r: 0, pnc: 0, total: 0 },
      { name: 'שלמה', position: 'DEF', p: 1, p60: 1, w: 2, c: -1, g: 0, a: 0, y: 0, r: 0, pnc: 0, total: 3 },
      { name: 'מזרחי', position: 'DEF', p: 1, p60: 1, w: 2, c: 4, g: 0, a: 0, y: 0, r: 0, pnc: 0, total: 8 },
      { name: 'קארבלי', position: 'DEF', p: 1, p60: 0, w: 2, c: 0, g: 0, a: 0, y: 0, r: 0, pnc: -5, total: -2 },
      { name: 'אלקוקין', position: 'MID', p: 1, p60: 1, w: 2, c: 0, g: 0, a: 0, y: 0, r: 0, pnc: 2, total: 6 },
      { name: 'אוואסו 2', position: 'MID', p: 1, p60: 1, w: 0, c: 0, g: 0, a: 0, y: 0, r: 0, pnc: 0, total: 2 },
      { name: 'רועי דוד', position: 'MID', p: 1, p60: 0, w: 0, c: 0, g: 0, a: 0, y: 0, r: 0, pnc: 0, total: 1 },
      { name: 'ברוניניו', position: 'MID', p: 1, p60: 1, w: 2, c: 0, g: 0, a: 3, y: 0, r: 0, pnc: 0, total: 7 },
      { name: 'דוידה', position: 'MID', p: 1, p60: 1, w: 2, c: 0, g: 0, a: 0, y: -2, r: 0, pnc: 0, total: 2 },
      { name: 'אריק בילה', position: 'FWD', p: 1, p60: 0, w: 0, c: 0, g: 0, a: 0, y: 0, r: 0, pnc: 0, total: 1 },
      { name: 'בואטנג', position: 'FWD', p: 1, p60: 1, w: 2, c: 0, g: 5, a: 0, y: 0, r: 0, pnc: 0, total: 9 }
    ],
    subs: [
      { playerOut: 'אריק בילה', playerIn: 'קאלו', p: 0, p60: 0, w: 2, c: 0, g: 0, a: 0, y: 0, r: 0, pnc: 0, total: 2 },
      { playerOut: 'רועי דוד', playerIn: 'זלאטן', p: 0, p60: 0, w: 2, c: 0, g: 0, a: 0, y: 0, r: 0, pnc: 0, total: 2 }
    ]
  },
  pichichi: {
    name: 'פיצ\'יצ\'י',
    targetScore: 56,
    players: [
      { name: 'ג\'ראפי', position: 'GK', p: 1, p60: 1, w: 0, c: -2, g: 0, a: 0, y: 0, r: 0, pnc: 3, total: 3 },
      { name: 'בן הרוש', position: 'DEF', p: 1, p60: 1, w: 2, c: -1, g: 0, a: 0, y: 0, r: 0, pnc: 0, total: 3 },
      { name: 'קוקו', position: 'DEF', p: 1, p60: 1, w: 2, c: 4, g: 4, a: 0, y: 0, r: 0, pnc: 0, total: 12 },
      { name: 'סבח', position: 'DEF', p: 1, p60: 0, w: 0, c: -1, g: 0, a: 0, y: 0, r: 0, pnc: 0, total: 0 },
      { name: 'פרץ', position: 'MID', p: 1, p60: 1, w: 2, c: 0, g: 5, a: 0, y: 0, r: 0, pnc: 2, total: 11 },
      { name: 'קימבודי', position: 'MID', p: 1, p60: 0, w: 0, c: 0, g: 0, a: 0, y: -2, r: 0, pnc: -2, total: -3 },
      { name: 'כנעאן', position: 'MID', p: 1, p60: 1, w: 2, c: 0, g: 0, a: 0, y: 0, r: 0, pnc: 0, total: 4 },
      { name: 'רוטמן', position: 'MID', p: 1, p60: 1, w: 0, c: 0, g: 0, a: 0, y: 0, r: 0, pnc: 0, total: 2 },
      { name: 'נובאקוביץ\'', position: 'FWD', p: 1, p60: 1, w: 2, c: 0, g: 10, a: 0, y: 0, r: 0, pnc: 2, total: 16 },
      { name: 'נוביסי', position: 'FWD', p: 1, p60: 1, w: 0, c: 0, g: 0, a: 0, y: -2, r: 0, pnc: 0, total: 0 },
      { name: 'אנסה', position: 'FWD', p: 1, p60: 0, w: 2, c: 0, g: 5, a: 0, y: 0, r: 0, pnc: 0, total: 8 }
    ],
    subs: []
  },
  tampa: {
    name: 'טמפה',
    targetScore: 37,
    players: [
      { name: 'ארליך', position: 'GK', p: 1, p60: 1, w: 0, c: -4, g: 0, a: 0, y: 0, r: 0, pnc: 0, total: -2 },
      { name: 'קמארה', position: 'DEF', p: 0, p60: 0, w: 0, c: 0, g: 0, a: 0, y: 0, r: 0, pnc: -1, total: -1 },
      { name: 'סלמן', position: 'FWD', p: 1, p60: 0, w: 2, c: 0, g: 0, a: 0, y: 0, r: 0, pnc: 0, total: 3 },
      { name: 'נחמיאס', position: 'DEF', p: 1, p60: 1, w: 2, c: 4, g: 0, a: 0, y: -2, r: 0, pnc: 0, total: 6 },
      { name: 'יאניק', position: 'DEF', p: 1, p60: 1, w: 2, c: 4, g: 4, a: 0, y: 0, r: 0, pnc: 0, total: 12 },
      { name: 'אווסו', position: 'MID', p: 1, p60: 1, w: 2, c: 0, g: 0, a: 0, y: -2, r: 0, pnc: 0, total: 2 },
      { name: 'זערורה', position: 'MID', p: 1, p60: 1, w: 0, c: 0, g: 0, a: 3, y: 0, r: 0, pnc: 0, total: 5 },
      { name: 'גנאח', position: 'MID', p: 1, p60: 1, w: 2, c: 0, g: 5, a: 0, y: 0, r: 0, pnc: 0, total: 9 },
      { name: 'אזולאי', position: 'MID', p: 1, p60: 1, w: 0, c: 0, g: 0, a: 0, y: 0, r: 0, pnc: 0, total: 2 },
      { name: 'דאבו', position: 'FWD', p: 1, p60: 1, w: 0, c: 0, g: 0, a: 0, y: 0, r: 0, pnc: 0, total: 2 },
      { name: 'פופ', position: 'FWD', p: 0, p60: 0, w: 0, c: 0, g: 0, a: 0, y: 0, r: 0, pnc: 0, total: 0 }
    ],
    subs: [
      { playerOut: 'סלמן', playerIn: 'שועה', p: 0, p60: 0, w: 2, c: 0, g: 0, a: 0, y: -3, r: 0, pnc: -1, total: -1 }
    ]
  },
  hamsili: {
    name: 'חמסילי',
    targetScore: 67,
    players: [
      { name: 'מרציאנו', position: 'GK', p: 1, p60: 1, w: 2, c: 5, g: 0, a: 0, y: 0, r: 0, pnc: 0, total: 9 },
      { name: 'צ\'יקו', position: 'DEF', p: 1, p60: 1, w: 2, c: 4, g: 8, a: 0, y: 0, r: 0, pnc: 0, total: 16 },
      { name: 'מנדי', position: 'DEF', p: 1, p60: 0, w: 0, c: -2, g: 0, a: 0, y: 0, r: 0, pnc: 0, total: -1 },
      { name: 'לינדוויק', position: 'DEF', p: 1, p60: 0, w: 2, c: -1, g: 0, a: 0, y: 0, r: 0, pnc: 0, total: 2 },
      { name: 'רונלדו טברנייר', position: 'DEF', p: 1, p60: 1, w: 2, c: -1, g: 8, a: 0, y: 0, r: 0, pnc: -3, total: 8 },
      { name: 'אצילי', position: 'MID', p: 1, p60: 1, w: 2, c: 0, g: 5, a: 3, y: 0, r: 0, pnc: 2, total: 14 },
      { name: 'גורה', position: 'MID', p: 1, p60: 1, w: 2, c: 0, g: 5, a: 0, y: 0, r: 0, pnc: 0, total: 9 },
      { name: 'בילו', position: 'MID', p: 1, p60: 1, w: 0, c: 0, g: 5, a: 0, y: -2, r: 0, pnc: 0, total: 5 },
      { name: 'סלם', position: 'DEF', p: 1, p60: 0, w: 0, c: -3, g: 0, a: 0, y: 0, r: 0, pnc: 0, total: -2 },
      { name: 'תורג\'מן', position: 'FWD', p: 1, p60: 1, w: 0, c: 0, g: 0, a: 0, y: -2, r: 0, pnc: 0, total: 0 },
      { name: 'וייסמן', position: 'FWD', p: 1, p60: 0, w: 2, c: 0, g: 0, a: 0, y: 0, r: 0, pnc: 0, total: 3 }
    ],
    subs: [
      { playerOut: 'סלם', playerIn: 'פורסון', p: 0, p60: 0, w: 2, c: 0, g: 0, a: 0, y: 0, r: 0, pnc: 0, total: 2 },
      { playerOut: 'מנדי', playerIn: 'יחזקאל', p: 0, p60: 0, w: 2, c: 0, g: 0, a: 0, y: 0, r: 0, pnc: 0, total: 2 },
      { playerOut: 'לינדוויק', playerIn: 'מרדכי', p: 0, p60: 0, w: 0, c: 0, g: 0, a: 0, y: 0, r: 0, pnc: 0, total: 0 }
    ]
  },
  holonia: {
    name: 'חולוניה',
    targetScore: 42,
    players: [
      { name: 'צור', position: 'GK', p: 1, p60: 1, w: 2, c: 5, g: 0, a: 0, y: 0, r: 0, pnc: 0, total: 9 },
      { name: 'גנדרני', position: 'DEF', p: 1, p60: 1, w: 2, c: -1, g: 0, a: 0, y: -2, r: 0, pnc: 0, total: 1 },
      { name: 'סייף', position: 'DEF', p: 1, p60: 1, w: 2, c: -2, g: 0, a: 0, y: -2, r: 0, pnc: 0, total: 0 },
      { name: 'אמאדור', position: 'DEF', p: 1, p60: 0, w: 2, c: 0, g: 0, a: 0, y: 0, r: 0, pnc: 0, total: 3 },
      { name: 'זופאריץ\'', position: 'DEF', p: 1, p60: 0, w: 0, c: -2, g: 0, a: 0, y: 0, r: 0, pnc: 0, total: -1 },
      { name: 'קמפוס', position: 'MID', p: 1, p60: 1, w: 0, c: 0, g: 0, a: 0, y: 0, r: 0, pnc: 0, total: 2 },
      { name: 'וארלה', position: 'MID', p: 1, p60: 0, w: 2, c: 0, g: 0, a: 0, y: 0, r: 0, pnc: 0, total: 3 },
      { name: 'קניקובסקי', position: 'MID', p: 1, p60: 1, w: 2, c: 0, g: 0, a: 0, y: 0, r: 0, pnc: 0, total: 4 },
      { name: 'ברזאו', position: 'MID', p: 1, p60: 1, w: 2, c: 0, g: 0, a: 3, y: 0, r: 0, pnc: 0, total: 7 },
      { name: 'אליאל', position: 'MID', p: 1, p60: 1, w: 2, c: 0, g: 0, a: 3, y: 0, r: 0, pnc: 0, total: 7 },
      { name: 'אלטמן', position: 'FWD', p: 1, p60: 0, w: 2, c: 0, g: 0, a: 0, y: 0, r: 0, pnc: 0, total: 3 }
    ],
    subs: [
      { playerOut: 'אלטמן', playerIn: 'דאפה', p: 0, p60: 0, w: 2, c: 0, g: 0, a: 0, y: 0, r: 0, pnc: 0, total: 2 },
      { playerOut: 'וארלה', playerIn: 'מדמון', p: 0, p60: 0, w: 2, c: 0, g: 0, a: 0, y: -2, r: 0, pnc: 0, total: 0 },
      { playerOut: 'זופאריץ\'', playerIn: 'מוזי', p: 0, p60: 0, w: 2, c: 0, g: 0, a: 0, y: 0, r: 0, pnc: 0, total: 2 }
    ]
  }
};

function buildStatsObject(item) {
  const isGk = ['GK', 'שוער'].includes(item.position);
  const isDef = ['DEF', 'הגנה', 'בלם', 'מגן'].includes(item.position);

  let cleanSheet = false;
  let conceded = 0;

  if (isGk || isDef) {
    if (item.c >= 4 && item.p60) {
      cleanSheet = true;
      conceded = 0;
    } else if (item.c < 0) {
      conceded = Math.abs(item.c);
    }
  }

  // Determine goals count
  let goals = 0;
  if (item.g > 0) {
    if (isGk) goals = Math.round(item.g / 10);
    else if (isDef) goals = Math.round(item.g / 8);
    else goals = Math.round(item.g / 5);
  }

  // Determine assists count
  let assists = 0;
  if (item.a > 0) {
    if (isGk) assists = Math.round(item.a / 6);
    else if (isDef) assists = Math.round(item.a / 4);
    else assists = Math.round(item.a / 3);
  }

  return {
    started: item.p === 1,
    played60: item.p60 === 1,
    won: item.w === 2,
    cleanSheet,
    conceded,
    goals,
    assists,
    yellow: item.y < 0,
    red: item.r < 0,
    penaltyWon: item.pnc > 0 ? Math.floor(item.pnc / 2) : 0,
    ownGoals: item.pnc < 0 ? Math.floor(Math.abs(item.pnc) / 3) : 0,
    notInSquad: false,
    notPlayedIn16: false
  };
}

async function applyExactCsvStats() {
  console.log('🚀 Syncing Exact Stats and Breakdown for Round 5...\n');

  for (const teamId of Object.keys(csvFullData)) {
    const info = csvFullData[teamId];
    console.log(`=== Updating Team: ${teamId} (${info.name}) ===`);

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

    // 1. Process starting lineup
    let updatedLineup = info.players.map(item => {
      const found = findInSquad(item.name);
      const stats = buildStatsObject(item);
      return {
        ...(found || {}),
        name: item.name,
        position: item.position || found?.position || 'MID',
        points: item.total,
        stats,
        isStarting: true
      };
    });

    // 2. Process subs
    let subLogs = [];
    info.subs.forEach((s, idx) => {
      const stats = buildStatsObject(s);

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
        foundIn.points = s.total;
        foundIn.stats = stats;
      }
    });

    const currentTransfers = (data.transfers || []).filter(t => !t || Number(t.round) !== 5 || !t.type || !t.type.includes('HALFTIME'));
    const newTransfers = [...currentTransfers, ...subLogs];

    // 3. Update squad
    const updatedSquad = squad.map(sp => {
      const inLineup = updatedLineup.find(lp => cleanStr(lp.name) === cleanStr(sp.name));
      if (inLineup) return inLineup;

      const inSub = info.subs.find(sb => cleanStr(sb.playerIn) === cleanStr(sp.name));
      if (inSub) {
        return { ...sp, points: inSub.total, stats: buildStatsObject(inSub), isStarting: false };
      }

      return { ...sp, points: 0, stats: {}, isStarting: false };
    });

    // 4. Set lineupsByRound['5']
    const lineupsByRound = {
      ...(data.lineupsByRound || {}),
      '5': {
        lineup: updatedLineup,
        subsOut: updatedSquad.filter(sp => !updatedLineup.some(lp => cleanStr(lp.name) === cleanStr(sp.name))),
        savedAt: new Date().toISOString()
      }
    };

    // Calculate total score for verification
    const startingPts = updatedLineup.reduce((sum, p) => sum + (p.points || 0), 0);
    const subsPts = info.subs.reduce((sum, s) => sum + (s.total || 0), 0);
    const calcTotal = startingPts + subsPts;

    console.log(`  Starting Lineup Pts: ${startingPts}`);
    console.log(`  Subs Pts: ${subsPts}`);
    console.log(`  Calculated Total: ${calcTotal} | Expected: ${info.targetScore}`);

    await docRef.update({
      published_lineup: updatedLineup,
      lineup: updatedLineup,
      squad: updatedSquad,
      players: updatedSquad,
      transfers: newTransfers,
      lineupsByRound
    });

    console.log(`  💾 Updated Firestore for ${teamId} with exact stats!\n`);
  }

  console.log('🎉 ALL TEAMS STATS AND POINTS SYNCED EXACTLY WITH MANUAL CSV!');
}

applyExactCsvStats().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
