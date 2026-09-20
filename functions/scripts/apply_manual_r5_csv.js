const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

const cleanStr = (s) => String(s || '').toLowerCase().replace(/['"״׳`\-\s()]/g, '');

const round5Scores = {
  tumali: {
    name: 'תומאלי',
    targetScore: 48,
    lineup: [
      { name: 'סילבה', points: 6, position: 'GK' },
      { name: 'בטאיי', points: 2, position: 'DEF' },
      { name: 'מאיימבו', points: 8, position: 'DEF' },
      { name: 'קריצ\'אק', points: -1, position: 'DEF' },
      { name: 'אסנטה', points: 3, position: 'DEF' },
      { name: 'יוספי', points: 7, position: 'MID' },
      { name: 'חזן', points: 10, position: 'MID' },
      { name: 'ספר', points: 4, position: 'MID' },
      { name: 'לייבו', points: 0, position: 'DEF' },
      { name: 'סוקלר', points: 6, position: 'FWD' },
      { name: 'אוגריסה', points: 3, position: 'FWD' }
    ],
    subs: [
      { playerOut: 'לייבו', playerIn: 'צילופיה', inPoints: 0 },
      { playerOut: 'קריצ\'אק', playerIn: 'אחמד', inPoints: 0 }
    ]
  },
  harale: {
    name: 'חראלה',
    targetScore: 41,
    lineup: [
      { name: 'גלזר', points: 0, position: 'GK' },
      { name: 'שלמה', points: 3, position: 'DEF' },
      { name: 'מזרחי', points: 8, position: 'DEF' },
      { name: 'קארבלי', points: -2, position: 'DEF' },
      { name: 'אלקוקין', points: 6, position: 'MID' },
      { name: 'אווסו', points: 2, position: 'MID' },
      { name: 'רועי דוד', points: 1, position: 'MID' },
      { name: 'ברוניניו', points: 7, position: 'MID' },
      { name: 'דוידה', points: 2, position: 'MID' },
      { name: 'אריק בילה', points: 1, position: 'FWD' },
      { name: 'בואטנג', points: 9, position: 'FWD' }
    ],
    subs: [
      { playerOut: 'אריק בילה', playerIn: 'קאלו', inPoints: 2 },
      { playerOut: 'רועי דוד', playerIn: 'זלאטן', inPoints: 2 }
    ]
  },
  pichichi: {
    name: 'פיצ\'יצ\'י',
    targetScore: 56,
    lineup: [
      { name: 'ג\'ראפי', points: 3, position: 'GK' },
      { name: 'בן הרוש', points: 3, position: 'DEF' },
      { name: 'קוקו', points: 12, position: 'DEF' },
      { name: 'סבח', points: 0, position: 'DEF' },
      { name: 'פרץ', points: 11, position: 'MID' },
      { name: 'קימבודי', points: -3, position: 'MID' },
      { name: 'כנעאן', points: 4, position: 'MID' },
      { name: 'רוטמן', points: 2, position: 'MID' },
      { name: 'נובאקוביץ\'', points: 16, position: 'FWD' },
      { name: 'נוביסי', points: 0, position: 'FWD' },
      { name: 'אנסה', points: 8, position: 'FWD' }
    ],
    subs: []
  },
  tampa: {
    name: 'טמפה',
    targetScore: 37,
    lineup: [
      { name: 'ארליך', points: -2, position: 'GK' },
      { name: 'קמארה', points: -1, position: 'DEF' },
      { name: 'סלמן', points: 3, position: 'FWD' },
      { name: 'נחמיאס', points: 6, position: 'DEF' },
      { name: 'יאניק', points: 12, position: 'DEF' },
      { name: 'אווסו', points: 2, position: 'MID' },
      { name: 'זערורה', points: 5, position: 'MID' },
      { name: 'גנאח', points: 9, position: 'MID' },
      { name: 'אזולאי', points: 2, position: 'MID' },
      { name: 'דאבו', points: 2, position: 'FWD' },
      { name: 'פופ', points: 0, position: 'FWD' }
    ],
    subs: [
      { playerOut: 'סלמן', playerIn: 'שועה', inPoints: -1 }
    ]
  },
  hamsili: {
    name: 'חמסילי',
    targetScore: 67,
    lineup: [
      { name: 'מרציאנו', points: 9, position: 'GK' },
      { name: 'צ\'יקו', points: 16, position: 'DEF' },
      { name: 'מנדי', points: -1, position: 'DEF' },
      { name: 'לינדוויק', points: 2, position: 'DEF' },
      { name: 'רונלדו טברנייר', points: 8, position: 'DEF' },
      { name: 'אצילי', points: 14, position: 'MID' },
      { name: 'גורה', points: 9, position: 'MID' },
      { name: 'בילו', points: 5, position: 'MID' },
      { name: 'סלם', points: -2, position: 'DEF' },
      { name: 'תורג\'מן', points: 0, position: 'FWD' },
      { name: 'וייסמן', points: 3, position: 'FWD' }
    ],
    subs: [
      { playerOut: 'סלם', playerIn: 'פורסון', inPoints: 2 },
      { playerOut: 'מנדי', playerIn: 'יחזקאל', inPoints: 2 },
      { playerOut: 'לינדוויק', playerIn: 'מרדכי', inPoints: 0 }
    ]
  },
  holonia: {
    name: 'חולוניה',
    targetScore: 42,
    lineup: [
      { name: 'צור', points: 9, position: 'GK' },
      { name: 'גנדרני', points: 1, position: 'DEF' },
      { name: 'סייף', points: 0, position: 'DEF' },
      { name: 'אמאדור', points: 3, position: 'DEF' },
      { name: 'זופאריץ\'', points: -1, position: 'DEF' },
      { name: 'קמפוס', points: 2, position: 'MID' },
      { name: 'וארלה', points: 3, position: 'MID' },
      { name: 'קניקובסקי', points: 4, position: 'MID' },
      { name: 'ברזאו', points: 7, position: 'MID' },
      { name: 'אליאל', points: 7, position: 'MID' },
      { name: 'אלטמן', points: 3, position: 'FWD' }
    ],
    subs: [
      { playerOut: 'אלטמן', playerIn: 'דאפה', inPoints: 2 },
      { playerOut: 'וארלה', playerIn: 'מדמון', inPoints: 0 },
      { playerOut: 'זופאריץ\'', playerIn: 'מוזי', inPoints: 2 }
    ]
  }
};

async function applyRound5FromCsv() {
  console.log('🚀 Starting Round 5 Sync from Manual CSV...\n');

  for (const teamId of Object.keys(round5Scores)) {
    const info = round5Scores[teamId];
    console.log(`=== Processing Team: ${teamId} (${info.name}) ===`);

    const docRef = db.collection('users').doc(teamId);
    const snap = await docRef.get();
    if (!snap.exists) {
      console.log(`❌ Doc not found for ${teamId}`);
      continue;
    }

    const data = snap.data();
    const squad = data.squad || data.players || [];

    // Helper to find player object in squad or create fallback
    const findInSquad = (nameStr) => {
      const cSearch = cleanStr(nameStr);
      return squad.find(p => {
        const cP = cleanStr(p.name || p.player);
        return cP && (cP === cSearch || cP.includes(cSearch) || cSearch.includes(cP));
      });
    };

    // 1. Prepare starting lineup
    let updatedLineup = info.lineup.map(item => {
      const found = findInSquad(item.name);
      return {
        ...(found || {}),
        name: item.name,
        position: item.position || found?.position || 'MID',
        points: item.points,
        isStarting: true
      };
    });

    // 2. Prepare transfers / halftime subs
    let currentTransfers = (data.transfers || []).filter(t => !t || Number(t.round) !== 5 || !t.type || !t.type.includes('HALFTIME'));
    
    let subLogs = [];
    info.subs.forEach((s, idx) => {
      const subLog = {
        id: `sub_r5_${teamId}_${idx}_${Date.now()}`,
        type: 'HALFTIME_SUB',
        round: 5,
        playerOut: s.playerOut,
        playerIn: s.playerIn,
        status: 'ACTIVE',
        actionBy: 'אדמין (סנכרון אקסל ידני)',
        timestamp: new Date().toLocaleString('he-IL', { hour12: false })
      };
      subLogs.push(subLog);

      // Find in squad to assign points to incoming sub
      const foundIn = findInSquad(s.playerIn);
      if (foundIn) {
        foundIn.points = s.inPoints;
      }
    });

    const newTransfers = [...currentTransfers, ...subLogs];

    // 3. Update lineupsByRound['5']
    const lineupsByRound = {
      ...(data.lineupsByRound || {}),
      '5': {
        lineup: updatedLineup,
        subsOut: squad.filter(sp => !updatedLineup.some(lp => cleanStr(lp.name) === cleanStr(sp.name))),
        savedAt: new Date().toISOString()
      }
    };

    // 4. Update squad points
    const updatedSquad = squad.map(sp => {
      const inLineup = updatedLineup.find(lp => cleanStr(lp.name) === cleanStr(sp.name));
      if (inLineup) {
        return { ...sp, points: inLineup.points, isStarting: true };
      }
      const inSub = info.subs.find(sb => cleanStr(sb.playerIn) === cleanStr(sp.name));
      if (inSub) {
        return { ...sp, points: inSub.inPoints, isStarting: false };
      }
      return { ...sp, points: 0, isStarting: false };
    });

    // Calculate total score for verification
    let startingPts = updatedLineup.reduce((acc, p) => acc + (p.points || 0), 0);
    let subsPts = info.subs.reduce((acc, s) => acc + (s.inPoints || 0), 0);
    let totalScore = startingPts + subsPts;

    console.log(`  Starting Lineup Pts: ${startingPts}`);
    console.log(`  Subs Pts: ${subsPts}`);
    console.log(`  Total Calculated Score: ${totalScore} (Expected: ${info.targetScore})`);

    if (totalScore !== info.targetScore) {
      console.warn(`  ⚠️ WARNING: Score mismatch for ${info.name}! Calc: ${totalScore}, Target: ${info.targetScore}`);
    } else {
      console.log(`  ✅ Score verified 100%!`);
    }

    // Save to Firestore
    await docRef.update({
      published_lineup: updatedLineup,
      lineup: updatedLineup,
      squad: updatedSquad,
      players: updatedSquad,
      transfers: newTransfers,
      lineupsByRound
    });

    console.log(`  💾 Updated Firestore for ${teamId}\n`);
  }

  console.log('🎉 ALL 6 TEAMS UPDATED IN FIRESTORE SUCCESSFULLY!');
}

applyRound5FromCsv().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
