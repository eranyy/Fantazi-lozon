const axios = require('axios');
const webhookUrl = 'https://script.google.com/macros/s/AKfycbzvVXPkBPHLgN2_0Xw9dGxXLgVS5NQFdklreZlRl-ORIdGF9YqO4hR4gRSkP-TPMdR0/exec';

async function testWebhook() {
  console.log('Testing Webhook POST request to Google Apps Script...');
  try {
    const res = await axios.post(webhookUrl, {
      sheetName: 'ארכיון ניקוד מחזורים',
      headers: ['מזהה סנכרון', 'תאריך', 'מחזור', 'קבוצת פנטזי', 'שם שחקן', 'ניקוד'],
      rows: [
        ['TEST_ID_1', new Date().toISOString().split('T')[0], 2, 'חראלה', 'דור פרץ', 17]
      ]
    });
    console.log('Webhook Response:', res.data);
  } catch (e) {
    console.error('Error posting to Webhook:', e.response?.data || e.message);
  }
}

testWebhook();
