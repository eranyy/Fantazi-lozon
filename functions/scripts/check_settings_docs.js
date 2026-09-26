const admin = require('firebase-admin');

if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function checkSettingsDocs() {
    console.log('=== CHECKING SETTINGS DOCUMENTS ===\n');

    const s1 = await db.doc('settings/league').get();
    console.log('settings/league:', s1.exists ? s1.data() : 'NOT EXISTS');

    const s2 = await db.doc('leagueData/settings').get();
    console.log('leagueData/settings:', s2.exists ? s2.data() : 'NOT EXISTS');

    const s3 = await db.doc('settings/currentRound').get();
    console.log('settings/currentRound:', s3.exists ? s3.data() : 'NOT EXISTS');

    const s4 = await db.collection('settings').get();
    console.log('\nAll docs in settings collection:');
    s4.forEach(d => console.log(d.id, d.data()));

    const rf = await db.doc('leagueData/realFixtures').get();
    console.log('\nrealFixtures doc exists:', rf.exists);
    if (rf.exists) {
        const rounds = rf.data()?.rounds || [];
        console.log(`Total rounds in realFixtures: ${rounds.length}`);
        const r6 = rounds.find(r => r.round === 6);
        console.log('Round 6 in realFixtures:', r6 ? `${r6.matches?.length} matches` : 'MISSING');
    }

    process.exit(0);
}

checkSettingsDocs().catch(e => {
    console.error(e);
    process.exit(1);
});
