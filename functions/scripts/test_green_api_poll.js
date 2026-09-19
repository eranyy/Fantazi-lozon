const axios = require('axios');

async function testPoll() {
  console.log('=== TESTING GREEN API NATIVE POLL METHOD ===\n');

  const groupChatId = '120363412136780106@g.us';
  const greenHost = 'https://7107.api.greenapi.com';
  const greenId = '710722713612';
  const greenToken = '4c1d55acf6d44149bbd1b515ae065b5131f83be1761a435e97';

  try {
    const res = await axios.post(`${greenHost}/waInstance${greenId}/sendPoll/${greenToken}`, {
      chatId: groupChatId,
      message: '🤖 *סוכן הלייב בדיקת סקר אישור!* 🏟️⚽\n\n⚽ *שער! מתן חוזז (מכבי נתניה)*\nמקור המידע: ספורט 5',
      options: [
        { optionName: '✅ מאשר לעדכן בזירה' },
        { optionName: '❌ דחה אירוע' }
      ]
    });

    console.log(`✅ Green API sendPoll succeeded! Status: ${res.status}`, res.data);
  } catch (err) {
    console.error('❌ Green API sendPoll error:', err.response?.data || err.message);
  }

  process.exit(0);
}

testPoll();
