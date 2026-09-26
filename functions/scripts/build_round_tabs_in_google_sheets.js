const admin = require('firebase-admin');
const axios = require('axios');

if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

const webhookUrl = 'https://script.google.com/macros/s/AKfycbxl5IFlmuqfk_CZ4fMBuPDLMQ7GHTp8dwPxNmTJYqSzDho2_qFz-K0lnjB1Vy-6GlTl/exec';

const TEAM_NAMES = {
    hamsili: 'חמסילי',
    harale: 'חראלה',
    holonia: 'חולוניה',
    pichichi: 'פיציצי',
    tampa: 'טמפה',
    tumali: 'תומאלי'
};

async function buildAllIndividualRoundTabs() {
    console.log('=== BUILDING INDIVIDUAL ROUND TABS (מחזור 1 - מחזור 5) ===\n');

    // 1. Fetch H2H Fixtures
    const fixSnap = await db.doc('leagueData/fixtures').get();
    const roundsData = fixSnap.data()?.rounds || [];

    // 2. Fetch all users (to get player teams/positions/names if missing)
    const usersSnap = await db.collection('users').get();
    const usersMap = {};
    usersSnap.forEach(uDoc => {
        usersMap[uDoc.id] = uDoc.data();
    });

    // 3. Process rounds 1 through 5
    for (let roundNum = 1; roundNum <= 5; roundNum++) {
        console.log(`\n--- BUILDING TAB FOR מחזור ${roundNum} ---`);

        const roundFixtures = roundsData.find(r => r.round === roundNum);
        if (!roundFixtures || !roundFixtures.matches) {
            console.log(`No fixtures found for round ${roundNum}, skipping.`);
            continue;
        }

        // Fetch round archive document from Firestore
        const archSnap = await db.collection('round_excel_archives').doc(`round_${roundNum}`).get();
        let archRows = archSnap.exists ? archSnap.data()?.rows || [] : [];

        // Map archive rows by team ID
        const teamLineups = {};
        Object.keys(TEAM_NAMES).forEach(tId => {
            teamLineups[tId] = [];
        });

        // Group player rows by team
        archRows.forEach(r => {
            let tId = r.userId || r.fantasyTeamId;
            if (!tId) {
                // Try finding team ID by fantasyTeamName
                const foundEntry = Object.entries(TEAM_NAMES).find(([id, name]) => name === r.fantasyTeam || name === r.fantasyTeamName);
                if (foundEntry) tId = foundEntry[0];
            }
            if (tId && teamLineups[tId]) {
                teamLineups[tId].push({
                    name: r.player || r.name,
                    points: Number(r.points || 0),
                    position: r.position || r.pos || 'MID',
                    realTeam: r.realTeam || r.team || ''
                });
            }
        });

        // Fallback: if archive didn't have full details, get from users' lineupsByRound
        Object.keys(TEAM_NAMES).forEach(tId => {
            if (teamLineups[tId].length < 11) {
                const uData = usersMap[tId];
                if (uData && uData.lineupsByRound && uData.lineupsByRound[roundNum]) {
                    const rData = uData.lineupsByRound[roundNum];
                    const lineup = rData.lineup || [];
                    teamLineups[tId] = lineup.map(p => ({
                        name: p.name,
                        points: Number(p.points || 0),
                        position: p.position || 'MID',
                        realTeam: p.team || p.realTeam || ''
                    }));
                }
            }
        });

        // Build the side-by-side round sheet rows
        const roundSheetRows = [];

        // Header for the entire sheet
        roundSheetRows.push([
            'קבוצת בית', 'קבוצת חוץ', 'קבוצה', 'שחקן בית', 'עמדה', 'ניקוד בית', 'קבוצה', 'שחקן חוץ', 'עמדה', 'ניקוד חוץ'
        ]);

        roundFixtures.matches.forEach((m, matchIdx) => {
            const hId = m.h;
            const aId = m.a;
            const hTeamName = TEAM_NAMES[hId] || hId;
            const aTeamName = TEAM_NAMES[aId] || aId;

            const hPlayers = teamLineups[hId] || [];
            const aPlayers = teamLineups[aId] || [];

            const hTotal = m.hs !== undefined ? m.hs : hPlayers.reduce((sum, p) => sum + p.points, 0);
            const aTotal = m.as !== undefined ? m.as : aPlayers.reduce((sum, p) => sum + p.points, 0);

            // Match Title Row
            roundSheetRows.push([
                hTeamName,
                `VS ${aTeamName}`,
                'קבוצה',
                'הרכב',
                'עמדה',
                'ניקוד',
                '',
                'סך הכל',
                hTotal,
                aTotal
            ]);

            // 11 Player Rows
            const maxPlayers = Math.max(11, hPlayers.length, aPlayers.length);
            for (let i = 0; i < maxPlayers; i++) {
                const hP = hPlayers[i] || {};
                const aP = aPlayers[i] || {};

                roundSheetRows.push([
                    '',
                    '',
                    hP.realTeam || '',
                    hP.name || '',
                    hP.position || '',
                    hP.name ? Number(hP.points || 0) : '',
                    aP.realTeam || '',
                    aP.name || '',
                    aP.position || '',
                    aP.name ? Number(aP.points || 0) : ''
                ]);
            }

            // Summary Row for Match
            roundSheetRows.push([
                '',
                '',
                'סיכום',
                '',
                '',
                hTotal,
                'סיכום',
                '',
                '',
                aTotal
            ]);

            // Empty spacer row between matches
            roundSheetRows.push(['', '', '', '', '', '', '', '', '', '']);
        });

        console.log(`Sending ${roundSheetRows.length} formatted rows for מחזור ${roundNum} to Webhook...`);

        try {
            const res = await axios.post(webhookUrl, JSON.stringify({
                sheetName: `מחזור ${roundNum}`,
                headers: roundSheetRows[0],
                rows: roundSheetRows.slice(1)
            }), { headers: { 'Content-Type': 'text/plain;charset=utf-8' }, maxRedirects: 10, timeout: 30000 });

            console.log(`✅ מחזור ${roundNum} tab response status:`, res.status, res.data);
        } catch (err) {
            console.error(`❌ Error posting מחזור ${roundNum} tab:`, err.message);
        }
    }

    console.log('\n=== ALL INDIVIDUAL ROUND TABS GENERATED AND POSTED SUCCESSFULLY ===');
    process.exit(0);
}

buildAllIndividualRoundTabs().catch(e => {
    console.error(e);
    process.exit(1);
});
