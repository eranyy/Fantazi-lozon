const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();
const axios = require('axios');

async function testTrackAndDelete() {
  console.log('=== INSPECTING AND CLEANING WHATSAPP BOT MESSAGES ===\n');

  const groupChatId = '120363412136780106@g.us';
  const greenHost = 'https://7107.api.greenapi.com';
  const greenId = '710722713612';
  const greenToken = '4c1d55acf6d44149bbd1b515ae065b5131f83be1761a435e97';

  // 1. Fetch from whatsapp_group_history
  const historySnap = await db.collection('whatsapp_group_history').orderBy('timestamp', 'desc').limit(50).get();
  console.log(`History records count: ${historySnap.size}`);

  const botMsgIds = [];
  historySnap.docs.forEach(doc => {
    const d = doc.data();
    if (d.idMessage && (d.senderPhone === 'bot' || d.isBot || String(d.messageText || '').includes('🤖') || String(d.messageText || '').includes('⚽') || String(d.messageText || '').includes('⏱️'))) {
      botMsgIds.push({ idMessage: d.idMessage, text: d.messageText?.slice(0, 30) });
    }
  });

  console.log(`Found ${botMsgIds.length} bot message IDs in history:`, botMsgIds);

  // 2. Attempt delete for each
  let deletedCount = 0;
  for (const item of botMsgIds) {
    try {
      const res = await axios.post(`${greenHost}/waInstance${greenId}/deleteMessage/${greenToken}`, {
        chatId: groupChatId,
        idMessage: item.idMessage
      });
      console.log(`  ✅ Deleted message ${item.idMessage} (${item.text}) -> Status: ${res.status}`);
      deletedCount++;
    } catch (err) {
      console.log(`  ℹ️ Message ${item.idMessage} could not be deleted: ${err.message}`);
    }
  }

  console.log(`\nTotal deleted: ${deletedCount}`);
  process.exit(0);
}

testTrackAndDelete();
