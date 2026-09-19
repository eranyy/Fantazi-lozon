const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function checkPendingAndHistory() {
  console.log('=== CHECKING LIVE PENDING EVENTS & WHATSAPP HISTORY ===\n');

  // 1. Pending events
  const pendingSnap = await db.collection('live_pending_events').orderBy('createdAt', 'desc').limit(10).get();
  console.log(`Total pending events count: ${pendingSnap.size}`);
  pendingSnap.docs.forEach(doc => {
    const d = doc.data();
    console.log(`  • Event [${doc.id}]: player="${d.player}", type="${d.eventType}", status="${d.status}", source="${d.source}"`);
  });

  // 2. WhatsApp Group History (latest 10 messages)
  console.log('\n=== LATEST 10 MESSAGES IN WHATSAPP GROUP HISTORY ===');
  const historySnap = await db.collection('whatsapp_group_history').orderBy('timestamp', 'desc').limit(10).get();
  historySnap.docs.forEach(doc => {
    const d = doc.data();
    const timeStr = new Date(d.timestamp).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    console.log(`  [${timeStr}] ${d.managerName || d.senderPhone}: "${d.messageText}"`);
  });

  process.exit(0);
}

checkPendingAndHistory();
