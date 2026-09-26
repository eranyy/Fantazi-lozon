const admin = require('firebase-admin');

if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function checkRealFixtures() {
    console.log('=== CHECKING LEAGUEDATA/REAL_FIXTURES ===\n');

    const snap = await db.doc('leagueData/real_fixtures').get();
    if (snap.exists) {
        const matches = snap.data()?.matches || [];
        console.log(`Total real matches in real_fixtures: ${matches.length}`);

        // Group by round
        const rounds = {};
        matches.forEach(m => {
            const r = m.round || 'unknown';
            if (!rounds[r]) rounds[r] = [];
            rounds[r].push(m);
        });

        console.log('Rounds breakdown:');
        Object.keys(rounds).sort((a,b) => Number(a)-Number(b)).forEach(r => {
            console.log(` Round ${r}: ${rounds[r].length} matches`);
        });

        console.log('\n--- ROUND 6 MATCHES ---');
        (rounds[6] || []).forEach((m, idx) => {
            console.log(` Match ${idx + 1}: ${m.homeTeam} VS ${m.awayTeam} | Date: ${m.date} (${m.day}) Time: ${m.time} | Stadium: ${m.stadium} | Status: ${m.status || ' עתידי'}`);
        });

        console.log('\n--- ROUND 7 MATCHES SAMPLE ---');
        (rounds[7] || []).slice(0, 3).forEach((m, idx) => {
            console.log(` Match ${idx + 1}: ${m.homeTeam} VS ${m.awayTeam} | Date: ${m.date} (${m.day}) Time: ${m.time}`);
        });

    } else {
        console.log('❌ leagueData/real_fixtures doc does NOT exist!');
    }

    process.exit(0);
}

checkRealFixtures().catch(e => {
    console.error(e);
    process.exit(1);
});
