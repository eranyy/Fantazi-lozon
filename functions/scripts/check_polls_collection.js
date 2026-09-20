const admin = require('firebase-admin');
if (!admin.apps.length) {
    admin.initializeApp({ projectId: 'fantasy-luzon' });
}
const db = admin.firestore();

async function checkPolls() {
    console.log('=== CHECKING WHATSAPP POLLS COLLECTION ===');
    const pollsSnap = await db.collection('whatsapp_polls').get();
    if (pollsSnap.empty) {
        console.log('No docs found in whatsapp_polls.');
    }
    pollsSnap.forEach(doc => {
        console.log(`Doc ID: ${doc.id}`);
        console.log(JSON.stringify(doc.data(), null, 2));
    });
    process.exit(0);
}

checkPolls();
