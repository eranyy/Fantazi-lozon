const axios = require('axios');
const webhookUrl = 'https://script.google.com/macros/s/AKfycbwquiK4tstJ8liGAZCRxH825SoMqPNbjEmqaaCaUqZT7-SsPs36iau4xi7217wmlWmL/exec';

async function deleteSyncColNow() {
  console.log('Sending delete_sync_col request to Apps Script...');
  const payload = JSON.stringify({
    action: 'delete_sync_col',
    sheetName: 'ארכיון ניקוד מחזורים'
  });

  try {
    const res = await axios.post(webhookUrl, payload, {
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      maxRedirects: 10
    });
    console.log('Delete column response:', res.data);
  } catch (e) {
    console.error('Error deleting column:', e.response?.data || e.message);
  }
}

deleteSyncColNow();
