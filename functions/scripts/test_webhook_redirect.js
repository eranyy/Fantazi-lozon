const axios = require('axios');
const webhookUrl = 'https://script.google.com/macros/s/AKfycbzvVXPkBPHLgN2_0Xw9dGxXLgVS5NQFdklreZlRl-ORIdGF9YqO4hR4gRSkP-TPMdR0/exec';

async function testWebhook() {
  console.log('Posting data to Google Apps Script Webhook...');
  try {
    const payload = JSON.stringify({
      sheetName: 'ארכיון ניקוד מחזורים',
      headers: ['מזהה סנכרון', 'תאריך', 'מחזור', 'קבוצת פנטזי', 'שם שחקן', 'ניקוד'],
      rows: [
        ['R2_hamsili_peretz', '2026-09-02', 2, 'פיציצי', 'פרץ', 17]
      ]
    });

    const res = await axios.post(webhookUrl, payload, {
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      maxRedirects: 10
    });
    console.log('✅ Webhook Success! Response:', res.data);
  } catch (e) {
    console.error('Webhook Error:', e.response?.data || e.message);
  }
}

testWebhook();
