const admin = require('firebase-admin');

if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function checkPredictorAndPolls() {
    console.log('=== CHECKING PREDICTOR STANDINGS & POLLS DATA ===\n');

    const predSnap = await db.doc('leagueData/predictor_standings').get();
    if (predSnap.exists) {
        console.log('--- PREDICTOR STANDINGS ---');
        console.log(JSON.stringify(predSnap.data(), null, 2));
    } else {
        console.log('❌ leagueData/predictor_standings document does NOT exist!');
    }

    console.log('\n--- WHATSAPP POLLS COLLECTION ---');
    const pollsSnap = await db.collection('whatsapp_polls').get();
    console.log(`Found ${pollsSnap.docs.length} polls in whatsapp_polls collection.`);
    pollsSnap.forEach(doc => {
        console.log(`Poll ID: ${doc.id}`);
        console.log(JSON.stringify(doc.data(), null, 2));
    });

    process.exit(0);
}

checkPredictorAndPolls().catch(e => {
    console.error(e);
    process.exit(1);
});
