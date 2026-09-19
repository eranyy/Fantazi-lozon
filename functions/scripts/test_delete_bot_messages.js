const axios = require('axios');
const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function testDeleteBotMessages() {
  console.log('=== TESTING DELETING RECENT BOT MESSAGES FOR EVERYONE ===\n');

  const groupChatId = '120363412136780106@g.us';
  const greenHost = 'https://7107.api.greenapi.com';
  const greenId = '710722713612';
  const greenToken = '4c1d55acf6d44149bbd1b515ae065b5131f83be1761a435e97';

  // Find recent bot messages stored in whatsapp_group_history or live_pending_events
  const pendingSnap = await db.collection('live_pending_events').get();
  console.log(`Found ${pendingSnap.size} pending events in DB.`);

  let deletedCount = 0;
  // If we logged message IDs in whatsapp_group_history
  const historySnap = await db.collection('whatsapp_group_history').orderBy('timestamp', 'desc').limit(20).get();
  for (const doc of historySnap.docs) {
    const d = doc.data();
    if (d.idMessage && d.senderPhone === 'bot') {
      try {
        console.log(`Deleting bot message ${d.idMessage}...`);
        await axios.post(`${greenHost}/waInstance${greenId}/deleteMessage/${greenToken}`, {
          chatId: groupChatId,
          idMessage: d.idMessage
        });
        deletedCount++;
      } catch (err) {
        console.error(`Error deleting message ${d.idMessage}:`, err.message);
      }
    }
  }

  console.log(`\nFinished attempt to delete bot messages. Deleted: ${deletedCount}`);
  process.exit(0);
}

testDeleteBotMessages();
