const axios = require('axios');
const webhookUrl = 'https://script.google.com/macros/s/AKfycbwquiK4tstJ8liGAZCRxH825SoMqPNbjEmqaaCaUqZT7-SsPs36iau4xi7217wmlWmL/exec';

async function testNewWebhook() {
  console.log('Testing NEW Google Apps Script Webhook...');
  try {
    const payload = JSON.stringify({
      sheetName: 'ארכיון ניקוד מחזורים',
      headers: ['מזהה סנכרון', 'תאריך', 'מחזור', 'קבוצת פנטזי', 'שם שחקן', 'ניקוד'],
      rows: [
        ['R2_test_peretz', '2026-09-02', 2, 'פיציצי', 'דור פרץ', 17]
      ]
    });

    const res = await axios.post(webhookUrl, payload, {
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      maxRedirects: 10
    });
    console.log('✅ NEW WEBHOOK RESPONSE:', res.data);
  } catch (e) {
    console.error('Webhook test error:', e.response?.data || e.message);
  }
}

testNewWebhook();
