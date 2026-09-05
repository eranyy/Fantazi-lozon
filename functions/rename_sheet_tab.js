const axios = require('axios');
const webhookUrl = 'https://script.google.com/macros/s/AKfycbwquiK4tstJ8liGAZCRxH825SoMqPNbjEmqaaCaUqZT7-SsPs36iau4xi7217wmlWmL/exec';

async function renameTabInAppsScript() {
  console.log('Sending rename request to Apps Script...');
  const payload = JSON.stringify({
    action: 'rename_sheet',
    oldName: 'גיליון1',
    newName: '📅 משחקי ליגת העל'
  });

  try {
    const res = await axios.post(webhookUrl, payload, {
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      maxRedirects: 10
    });
    console.log('Rename result:', res.data);
  } catch (e) {
    console.error('Error renaming:', e.response?.data || e.message);
  }
}

renameTabInAppsScript();
