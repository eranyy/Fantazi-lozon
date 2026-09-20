const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

const cleanStr = (s) => String(s || '').toLowerCase().replace(/['"״׳`\-\s()]/g, '');
const normalizeHebrewName = (s) => {
  if (!s) return '';
  let str = String(s).toLowerCase().replace(/['"״׳`\-\s()]/g, '');
  return str.replace(/א+/g, 'א').replace(/ו+/g, 'ו').replace(/י+/g, 'י');
};
const getPlayerName = (p) => {
  if (!p) return '';
  if (typeof p === 'string') return p.trim();
  const val = p.name || p.player || p.playerName || p.label || p.playerIn || p.playerOut || p.title || p.id || '';
  return typeof val === 'string' ? val.trim() : String(val).trim();
};
const safeArray = (val) => Array.isArray(val) ? val : [];
const isSamePlayer = (a, b) => {
  if (!a || !b) return false;
  if (a.id && b.id && a.id === b.id) return true;
  const aStr = getPlayerName(a); const bStr = getPlayerName(b);
  const cA = cleanStr(aStr); const cB = cleanStr(bStr);
  if (!cA || !cB) return false;
  const nA = normalizeHebrewName(aStr); const nB = normalizeHebrewName(bStr);
  return cA === cB || cA.includes(cB) || cB.includes(cA) || nA === nB || nA.includes(nB) || nB.includes(nA);
};

// Exact team configurations matching CSV breakdown
const teamConfigs = {
  tumali: {
    starting: [
      { name: 'סילבה', position: 'GK', points: 6, stats: { started: true, played60: true, won: true, conceded: 1, penaltySaved: 1 } },
      { name: 'בטאיי', position: 'DEF', points: 2, stats: { started: true, played60: true, won: true, conceded: 2 } },
      { name: 'מאיימבו', position: 'DEF', points: 8, stats: { started: true, played60: true, won: true, cleanSheet: true, conceded: 0 } },
      { name: 'קריצ\'אק', position: 'DEF', points: -1, stats: { started: true, played60: false, won: false, conceded: 2 } },
      { name: 'אסנטה', position: 'DEF', points: 3, stats: { started: true, played60: true, won: true, conceded: 1 } },
      { name: 'יוספי', position: 'MID', points: 7, stats: { started: true, played60: true, won: true, assists: 1 } },
      { name: 'חזן', position: 'MID', points: 10, stats: { started: true, played60: true, won: false, goals: 1, assists: 1 } },
      { name: 'ספר', position: 'MID', points: 4, stats: { started: true, played60: true, won: true } },
      { name: 'לייבו', position: 'DEF', points: 0, stats: { started: true, played60: false, won: false, conceded: 1 } },
      { name: 'סוקלר', position: 'FWD', points: 6, stats: { started: true, played60: true, won: true, penaltyWon: 1 } },
      { name: 'אוגריסה', position: 'FWD', points: 3, stats: { started: true, played60: false, won: true } }
    ],
    subs: [
      { playerOut: 'לייבו', playerIn: 'צילופיה', points: 0, stats: { started: false, played60: false, won: false } },
      { playerOut: 'קריצ\'אק', playerIn: 'אחמד', points: 0, stats: { started: false, played60: false, won: false } }
    ]
  },
  harale: {
    starting: [
      { name: 'גלזר', position: 'GK', points: 0, stats: { started: true, played60: true, won: true, conceded: 2, yellow: true } },
      { name: 'שלמה', position: 'DEF', points: 3, stats: { started: true, played60: true, won: true, conceded: 1 } },
      { name: 'מזרחי', position: 'DEF', points: 8, stats: { started: true, played60: true, won: true, cleanSheet: true, conceded: 0 } },
      { name: 'קארבלי', position: 'DEF', points: -2, stats: { started: true, played60: false, won: true, ownGoals: 1, yellow: true } },
      { name: 'אלקוקין', position: 'MID', points: 6, stats: { started: true, played60: true, won: true, penaltyWon: 1 } },
      { name: 'אוואסו 2', position: 'MID', points: 2, stats: { started: true, played60: true, won: false } },
      { name: 'רועי דוד', position: 'MID', points: 1, stats: { started: true, played60: false, won: false } },
      { name: 'ברוניניו', position: 'MID', points: 7, stats: { started: true, played60: true, won: true, assists: 1 } },
      { name: 'דוידה', position: 'MID', points: 2, stats: { started: true, played60: true, won: true, yellow: true } },
      { name: 'אריק בילה', position: 'FWD', points: 1, stats: { started: true, played60: false, won: false } },
      { name: 'בואטנג', position: 'FWD', points: 9, stats: { started: true, played60: true, won: true, goals: 1 } }
    ],
    subs: [
      { playerOut: 'אריק בילה', playerIn: 'קאלו', points: 2, stats: { started: false, played60: false, won: true } },
      { playerOut: 'רועי דוד', playerIn: 'זלאטן', points: 2, stats: { started: false, played60: false, won: true } }
    ]
  },
  pichichi: {
    starting: [
      { name: 'ג\'ראפי', position: 'GK', points: 3, stats: { started: true, played60: true, won: false, conceded: 2, penaltySaved: 1 } },
      { name: 'בן הרוש', position: 'DEF', points: 3, stats: { started: true, played60: true, won: true, conceded: 1 } },
      { name: 'קוקו', position: 'DEF', points: 12, stats: { started: true, played60: true, won: true, cleanSheet: true, conceded: 0, assists: 1 } },
      { name: 'סבח', position: 'DEF', points: 0, stats: { started: true, played60: false, won: false, conceded: 1 } },
      { name: 'פרץ', position: 'MID', points: 11, stats: { started: true, played60: true, won: true, goals: 1, penaltyWon: 1 } },
      { name: 'קימבודי', position: 'MID', points: -3, stats: { started: true, played60: false, won: false, yellow: true, penaltyWon: -1 } },
      { name: 'כנעאן', position: 'MID', points: 4, stats: { started: true, played60: true, won: true } },
      { name: 'רוטמן', position: 'MID', points: 2, stats: { started: true, played60: true, won: false } },
      { name: 'נובאקוביץ\'', position: 'FWD', points: 16, stats: { started: true, played60: true, won: true, goals: 2, penaltyWon: 1 } },
      { name: 'נוביסי', position: 'FWD', points: 0, stats: { started: true, played60: true, won: false, yellow: true } },
      { name: 'אנסה', position: 'FWD', points: 8, stats: { started: true, played60: false, won: true, goals: 1 } }
    ],
    subs: []
  },
  tampa: {
    starting: [
      { name: 'ארליך', position: 'GK', points: -2, stats: { started: true, played60: true, won: false, conceded: 4 } },
      { name: 'קמארה', position: 'DEF', points: -1, stats: { started: false, played60: false, won: false, notInSquad: true } },
      { name: 'סלמן', position: 'FWD', points: 3, stats: { started: true, played60: false, won: true } },
      { name: 'נחמיאס', position: 'DEF', points: 6, stats: { started: true, played60: true, won: true, cleanSheet: true, yellow: true } },
      { name: 'יאניק', position: 'DEF', points: 12, stats: { started: true, played60: true, won: true, cleanSheet: true, assists: 1 } },
      { name: 'אווסו', position: 'MID', points: 2, stats: { started: true, played60: true, won: true, yellow: true } },
      { name: 'זערורה', position: 'MID', points: 5, stats: { started: true, played60: true, won: false, assists: 1 } },
      { name: 'גנאח', position: 'MID', points: 9, stats: { started: true, played60: true, won: true, goals: 1 } },
      { name: 'אזולאי', position: 'MID', points: 2, stats: { started: true, played60: true, won: false } },
      { name: 'דאבו', position: 'FWD', points: 2, stats: { started: true, played60: true, won: false } },
      { name: 'פופ', position: 'FWD', points: 0, stats: { started: false, played60: false, won: false } }
    ],
    subs: [
      { playerOut: 'סלמן', playerIn: 'שועה', points: -1, stats: { started: false, played60: false, won: true, yellow: true, notInSquad: true } }
    ]
  },
  hamsili: {
    starting: [
      { name: 'מרציאנו', position: 'GK', points: 9, stats: { started: true, played60: true, won: true, cleanSheet: true, conceded: 0 } },
      { name: 'צ\'יקו', position: 'DEF', points: 16, stats: { started: true, played60: true, won: true, cleanSheet: true, goals: 1, conceded: 0 } },
      { name: 'מנדי', position: 'DEF', points: -1, stats: { started: true, played60: false, won: false, conceded: 2 } },
      { name: 'לינדוויק', position: 'DEF', points: 2, stats: { started: true, played60: false, won: true, conceded: 1 } },
      { name: 'רונלדו טברנייר', position: 'DEF', points: 8, stats: { started: true, played60: true, won: true, goals: 1, conceded: 2, yellow: true } },
      { name: 'אצילי', position: 'MID', points: 14, stats: { started: true, played60: true, won: true, goals: 1, assists: 1, penaltyWon: 1 } },
      { name: 'גורה', position: 'MID', points: 9, stats: { started: true, played60: true, won: true, goals: 1 } },
      { name: 'בילו', position: 'MID', points: 5, stats: { started: true, played60: true, won: false, goals: 1, yellow: true } },
      { name: 'סלם', position: 'DEF', points: -2, stats: { started: true, played60: false, won: false, conceded: 3 } },
      { name: 'תורג\'מן', position: 'FWD', points: 0, stats: { started: true, played60: true, won: false, yellow: true } },
      { name: 'וייסמן', position: 'FWD', points: 3, stats: { started: true, played60: false, won: true } }
    ],
    subs: []
  },
  holonia: {
    starting: [
      { name: 'צור', position: 'GK', points: 9, stats: { started: true, played60: true, won: true, cleanSheet: true, conceded: 0 } },
      { name: 'גנדרני', position: 'DEF', points: 1, stats: { started: true, played60: true, won: true, conceded: 1, yellow: true } },
      { name: 'סייף', position: 'DEF', points: 0, stats: { started: true, played60: true, won: true, conceded: 2, yellow: true } },
      { name: 'אמאדור', position: 'DEF', points: 3, stats: { started: true, played60: false, won: true, conceded: 0 } },
      { name: 'מוזי', position: 'MID', points: 2, stats: { started: false, played60: false, won: true } },
      { name: 'קמפוס', position: 'MID', points: 2, stats: { started: true, played60: true, won: false } },
      { name: 'מדמון', position: 'FWD', points: 0, stats: { started: false, played60: false, won: true, yellow: true } },
      { name: 'קניקובסקי', position: 'MID', points: 4, stats: { started: true, played60: true, won: true } },
      { name: 'ברזאו', position: 'MID', points: 7, stats: { started: true, played60: true, won: true, assists: 1 } },
      { name: 'אליאל', position: 'MID', points: 7, stats: { started: true, played60: true, won: true, assists: 1 } },
      { name: 'דאפה', position: 'FWD', points: 2, stats: { started: false, played60: false, won: true } }
    ],
    subs: []
  }
};

async function applyExactCsvStats() {
  for (const [teamId, config] of Object.entries(teamConfigs)) {
    console.log(`\nUpdating team ${teamId}...`);
    const userRef = db.collection('users').doc(teamId);
    const docSnap = await userRef.get();
    if (!docSnap.exists) continue;
    const teamData = docSnap.data();

    // 1. Build updated published_lineup
    const updatedLineup = config.starting.map(sp => {
      const existing = (teamData.published_lineup || teamData.lineup || []).find(p => isSamePlayer(p, sp));
      return {
        ...(existing || {}),
        name: sp.name,
        position: sp.position,
        points: sp.points,
        stats: sp.stats,
        isStarting: true
      };
    });

    // 2. Build updated published_subs_out
    const updatedSubsOut = (config.subs || []).map(sub => {
      return {
        name: sub.playerIn,
        points: sub.points,
        stats: sub.stats,
        isStarting: false
      };
    });

    // Also include subbed-out starting players in subs_out so halftime sub lookup works
    config.subs?.forEach(sub => {
      const outPlayer = config.starting.find(sp => isSamePlayer(sp, { name: sub.playerOut }));
      if (outPlayer && !updatedSubsOut.some(p => isSamePlayer(p, outPlayer))) {
        updatedSubsOut.push({
          name: outPlayer.name,
          position: outPlayer.position,
          points: outPlayer.points,
          stats: outPlayer.stats,
          isStarting: false
        });
      }
    });

    // 3. Update squad array
    let updatedSquad = [...(teamData.squad || [])];
    [...config.starting, ...(config.subs?.map(s => ({ name: s.playerIn, points: s.points, stats: s.stats })) || [])].forEach(sp => {
      const idx = updatedSquad.findIndex(p => isSamePlayer(p, sp));
      if (idx !== -1) {
        updatedSquad[idx] = { ...updatedSquad[idx], points: sp.points, stats: sp.stats };
      } else {
        updatedSquad.push({ name: sp.name, points: sp.points, stats: sp.stats, position: sp.position || 'MID' });
      }
    });

    // 4. Update lineupsByRound
    const lineupsByRound = teamData.lineupsByRound || {};
    lineupsByRound['5'] = {
      lineup: updatedLineup,
      subsOut: updatedSubsOut,
      timestamp: new Date().toISOString()
    };

    // 5. Update transfers (HALFTIME_SUBs)
    let transfers = safeArray(teamData.transfers);
    if (config.subs && config.subs.length > 0) {
      config.subs.forEach(sub => {
        const exists = transfers.some(t => t.type === 'HALFTIME_SUB' && Number(t.round) === 5 && isSamePlayer({ name: t.playerOut }, { name: sub.playerOut }));
        if (!exists) {
          transfers.push({
            id: `sub_r5_${Math.random().toString(36).substring(2, 7)}`,
            type: 'HALFTIME_SUB',
            round: 5,
            playerOut: sub.playerOut,
            playerIn: sub.playerIn,
            status: 'ACTIVE',
            timestamp: new Date().toISOString()
          });
        }
      });
    }

    await userRef.update({
      published_lineup: updatedLineup,
      lineup: updatedLineup,
      published_subs_out: updatedSubsOut,
      squad: updatedSquad,
      players: updatedSquad,
      lineupsByRound: lineupsByRound,
      transfers: transfers
    });

    console.log(`✅ ${teamId} updated!`);
  }
}

applyExactCsvStats().then(() => {
  console.log('\nAll 6 teams updated with exact CSV stats!');
  process.exit(0);
});
