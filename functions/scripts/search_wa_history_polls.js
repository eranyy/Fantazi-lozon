const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function searchWAGroupHistory() {
  console.log('--- SEARCHING WHATSAPP GROUP HISTORY & LOGS FOR POLLS ---');
  
  const snap1 = await db.collection('whatsapp_group_history').get();
  console.log(`Found ${snap1.size} messages in whatsapp_group_history.`);
  snap1.forEach(doc => {
    const text = JSON.stringify(doc.data());
    if (text.includes('סקר') || text.includes('ניחוס') || text.includes('מחזור 2') || text.includes('סקר ניחושים') || text.includes('poll')) {
      console.log('  Doc ID:', doc.id, text.slice(0, 300));
    }
  });

  const snap2 = await db.collection('whatsapp_incoming_logs').get();
  console.log(`Found ${snap2.size} messages in whatsapp_incoming_logs.`);
  snap2.forEach(doc => {
    const text = JSON.stringify(doc.data());
    if (text.includes('סקר') || text.includes('ניחוס') || text.includes('מחזור 2') || text.includes('poll') || text.includes('vote')) {
      console.log('  Incoming Doc ID:', doc.id, text.slice(0, 300));
    }
  });
}

searchWAGroupHistory().catch(console.error);
