const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

function calculateOptimalLineupServer(squad) {
    if (!Array.isArray(squad) || squad.length === 0) return { optimalPoints: 0, formation: '4-4-2', lineup: [] };

    const getPos = (pStr) => {
        const p = String(pStr || '').toUpperCase().trim();
        if (p.includes('GK') || p.includes('שוער')) return 'GK';
        if (p.includes('DEF') || p.includes('הגנה') || p.includes('בלם') || p.includes('מגן')) return 'DEF';
        if (p.includes('MID') || p.includes('קשר') || p.includes('קישור')) return 'MID';
        if (p.includes('FWD') || p.includes('חלוץ') || p.includes('התקפה')) return 'FWD';
        return 'MID';
    };

    const gks = [];
    const defs = [];
    const mids = [];
    const fwds = [];

    squad.forEach(pl => {
        const pos = getPos(pl.position);
        if (pos === 'GK') gks.push(pl);
        else if (pos === 'DEF') defs.push(pl);
        else if (pos === 'MID') mids.push(pl);
        else if (pos === 'FWD') fwds.push(pl);
    });

    const sortByPts = (a, b) => (Number(b.points) || 0) - (Number(a.points) || 0);
    gks.sort(sortByPts); defs.sort(sortByPts); mids.sort(sortByPts); fwds.sort(sortByPts);

    const bestGK = gks[0] || null;
    if (!bestGK) return { optimalPoints: 0, formation: '4-4-2', lineup: squad.slice(0, 11) };

    const FORMATIONS = [
        { d: 5, m: 3, f: 2, name: '5-3-2' },
        { d: 5, m: 4, f: 1, name: '5-4-1' },
        { d: 4, m: 5, f: 1, name: '4-5-1' },
        { d: 4, m: 4, f: 2, name: '4-4-2' },
        { d: 4, m: 3, f: 3, name: '4-3-3' },
        { d: 3, m: 5, f: 2, name: '3-5-2' },
        { d: 3, m: 4, f: 3, name: '3-4-3' }
    ];

    let best = null;

    for (const form of FORMATIONS) {
        if (defs.length < form.d || mids.length < form.m || fwds.length < form.f) continue;
        const selected11 = [bestGK, ...defs.slice(0, form.d), ...mids.slice(0, form.m), ...fwds.slice(0, form.f)];

        const totalPts = selected11.reduce((sum, pl) => sum + (Number(pl.points) || 0), 0);

        if (!best || totalPts > best.optimalPoints) {
            best = {
                optimalPoints: totalPts,
                formation: form.name,
                lineup: selected11
            };
        }
    }

    return best || { optimalPoints: 0, formation: '4-4-2', lineup: squad.slice(0, 11) };
}

async function testOptimalLineups() {
    console.log('=== RE-TESTING OPTIMAL (BINGO) LINEUPS WITHOUT CAPTAIN MULTIPLIER ===');
    const usersSnap = await db.collection('users').get();
    
    usersSnap.docs.forEach(d => {
        const u = d.data();
        if (u.teamName === 'ADMIN' || u.name === 'ADMIN') return;
        const squad = u.published_lineup || u.lineup || [];
        const opt = calculateOptimalLineupServer(squad);
        const actualPts = squad.reduce((acc, pl) => acc + (Number(pl.points) || 0), 0);
        const diff = Math.max(0, opt.optimalPoints - actualPts);

        console.log(`\nManager: ${u.teamName} (${u.manager})`);
        console.log(`  Actual Points: ${actualPts} pts`);
        console.log(`  Optimal (Bingo) Points: ${opt.optimalPoints} pts (Formation ${opt.formation})`);
        console.log(`  Potential Gain: +${diff} pts`);
    });

    process.exit(0);
}

testOptimalLineups();
