const admin = require('firebase-admin');

if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function checkRound6Status() {
    console.log('=== CHECKING ROUND 6 READINESS STATUS ===\n');

    // 1. Current Round Settings
    const setSnap = await db.doc('settings/league').get();
    console.log('--- LEAGUE SETTINGS ---');
    console.log('Current Round setting:', setSnap.data());

    // 2. Real Fixtures for Round 6
    const realSnap = await db.doc('leagueData/realFixtures').get();
    const realRounds = realSnap.data()?.rounds || [];
    const r6Real = realRounds.find(r => r.round === 6);
    console.log('\n--- REAL FIXTURES ROUND 6 ---');
    if (r6Real) {
        console.log(`Found ${r6Real.matches?.length || 0} real matches for Round 6:`);
        r6Real.matches?.forEach((m, idx) => {
            console.log(` Match ${idx + 1}: ${m.homeTeam} VS ${m.awayTeam} | ${m.date} (${m.day}) ${m.time} | Stadium: ${m.stadium} | Status: ${m.status || 'עתידי'}`);
        });
    } else {
        console.log('❌ No Round 6 real fixtures found!');
    }

    // 3. Fantasy Fixtures for Round 6
    const fixSnap = await db.doc('leagueData/fixtures').get();
    const rounds = fixSnap.data()?.rounds || [];
    const r6Fantasy = rounds.find(r => r.round === 6);
    console.log('\n--- FANTASY FIXTURES ROUND 6 ---');
    if (r6Fantasy) {
        console.log(`Fantasy Round 6 status: isPlayed = ${r6Fantasy.isPlayed}`);
        r6Fantasy.matches?.forEach((m, idx) => {
            console.log(` Match ${idx + 1}: ${m.h} VS ${m.a} | Result: ${m.hs !== undefined ? m.hs : '-'} : ${m.as !== undefined ? m.as : '-'}`);
        });
    } else {
        console.log('❌ No Round 6 fantasy fixtures found!');
    }

    // 4. Users status (squads, lineups, reset status)
    console.log('\n--- FANTASY TEAMS ROUND 6 READINESS ---');
    const usersSnap = await db.collection('users').get();
    usersSnap.forEach(uDoc => {
        const u = uDoc.data();
        const lineupCount = u.lineup?.length || u.published_lineup?.length || 0;
        const squadCount = u.squad?.length || 0;
        console.log(` Team ${uDoc.id} (${u.teamName}): Squad=${squadCount} players | Lineup set=${lineupCount} players | Points=${u.points}`);
    });

    process.exit(0);
}

checkRound6Status().catch(e => {
    console.error(e);
    process.exit(1);
});
